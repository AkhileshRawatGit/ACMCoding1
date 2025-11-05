package com.code.codingplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PistonService {

    @Value("${piston.api.url:https://emkc.org/api/v2/piston}")
    private String pistonApiUrl;

    // Configurable rate-limit controls with safe defaults
    @Value("${piston.rate.min-interval-ms:220}")
    private long minIntervalMs;

    @Value("${piston.rate.max-retries:4}")
    private int maxRetries;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, String> languageVersionCache = new HashMap<>();

    // Simple per-instance throttle
    private final Object rateLock = new Object();
    private volatile long lastCallAt = 0L;

    private void respectRateLimit() {
        synchronized (rateLock) {
            long now = System.currentTimeMillis();
            long elapsed = now - lastCallAt;
            long wait = minIntervalMs - elapsed;
            if (wait > 0) {
                try { Thread.sleep(wait); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
            }
            lastCallAt = System.currentTimeMillis();
        }
    }

    // Judge0 language ID to Piston language mapping
    public String mapJudge0LanguageIdToPiston(int languageId) {
        return switch (languageId) {
            case 50 -> "c";
            case 54 -> "cpp";
            case 62 -> "java";
            case 63 -> "javascript";
            case 71 -> "python";
            case 68 -> "go";
            case 74 -> "typescript";
            case 72 -> "ruby";
            case 46 -> "bash";
            case 75 -> "csharp";
            default -> throw new IllegalArgumentException("Unsupported languageId: " + languageId);
        };
    }

    // Choose file name based on language
    private String chooseFileName(String language) {
        return switch (language) {
            case "python" -> "main.py";
            case "javascript" -> "main.js";
            case "typescript" -> "main.ts";
            case "java" -> "Main.java";
            case "cpp" -> "main.cpp";
            case "c" -> "main.c";
            case "go" -> "main.go";
            case "ruby" -> "main.rb";
            case "bash" -> "main.sh";
            case "csharp" -> "Main.cs";
            default -> "main.txt";
        };
    }

    // Get version for Piston; fallback to "*" for public API
    private String getLatestVersion(String language) throws Exception {
        if (languageVersionCache.containsKey(language)) {
            return languageVersionCache.get(language);
        }
        // Also respect rate-limit for runtimes call
        respectRateLimit();
        String url = pistonApiUrl + "/runtimes";
        ResponseEntity<JsonNode> resp = restTemplate.exchange(url, HttpMethod.GET, null, JsonNode.class);
        if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null && resp.getBody().isArray()) {
            for (JsonNode node : resp.getBody()) {
                if (language.equals(node.path("language").asText())) {
                    String version = node.path("version").asText();
                    languageVersionCache.put(language, version);
                    return version;
                }
            }
        }
        // fallback for public API
        languageVersionCache.put(language, "*");
        return "*";
    }

    // Execute code using Piston API
    public JsonNode executeCode(String code, String language, String stdin, Integer runTimeoutMs) throws Exception {
        String version = getLatestVersion(language);
        String fileName = chooseFileName(language);

        ObjectNode body = objectMapper.createObjectNode();
        body.put("language", language);      // "cpp", "python", "java", etc.
        body.put("version", version);        // "*" for public API
        body.put("stdin", stdin != null ? stdin : "");
        body.put("compile_timeout", 10000);
        body.put("run_timeout", runTimeoutMs != null ? runTimeoutMs : 3000);
        body.put("compile_memory_limit", -1);
        body.put("run_memory_limit", -1);

        ArrayNode files = objectMapper.createArrayNode();
        ObjectNode mainFile = objectMapper.createObjectNode();
        mainFile.put("name", fileName);
        mainFile.put("content", code != null ? code : "");
        files.add(mainFile);
        body.set("files", files);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        // Rate-limit + retry with backoff on 429
        int attempt = 0;
        while (true) {
            attempt++;
            respectRateLimit();
            try {
                ResponseEntity<JsonNode> resp = restTemplate.exchange(
                        pistonApiUrl + "/execute",
                        HttpMethod.POST,
                        entity,
                        JsonNode.class
                );
                if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                    throw new RuntimeException("Piston /execute failed with status: " + resp.getStatusCode());
                }
                return resp.getBody();
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS && attempt <= maxRetries) {
                    // Exponential-ish backoff: minInterval * attempt
                    long backoff = Math.max(minIntervalMs, minIntervalMs * attempt);
                    try { Thread.sleep(backoff); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                    continue;
                }
                throw e;
            }
        }
    }

    public List<JsonNode> executeCodeBatch(String code, String language, List<String> inputs, Integer runTimeoutMs) throws Exception {
        List<JsonNode> results = new ArrayList<>();
        List<Thread> threads = new ArrayList<>();
        List<Exception> exceptions = new ArrayList<>();
        Object exceptionLock = new Object();

        for (String input : inputs) {
            Thread thread = new Thread(() -> {
                try {
                    JsonNode result = executeCode(code, language, input, runTimeoutMs);
                    synchronized (results) {
                        results.add(result);
                    }
                } catch (Exception e) {
                    synchronized (exceptionLock) {
                        exceptions.add(e);
                    }
                }
            });
            threads.add(thread);
            thread.start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            try {
                thread.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Check if any exceptions occurred
        if (!exceptions.isEmpty()) {
            throw exceptions.get(0);
        }

        return results;
    }

    public JsonNode executeCodeOptimized(String code, String language, String stdin, Integer runTimeoutMs) throws Exception {
        String version = getLatestVersion(language);
        String fileName = chooseFileName(language);

        ObjectNode body = objectMapper.createObjectNode();
        body.put("language", language);
        body.put("version", version);
        body.put("stdin", stdin != null ? stdin : "");
        body.put("compile_timeout", 5000); // Reduced from 10s to 5s
        body.put("run_timeout", Math.min(runTimeoutMs != null ? runTimeoutMs : 3000, 2000)); // Cap at 2s for faster feedback
        body.put("compile_memory_limit", -1);
        body.put("run_memory_limit", -1);

        ArrayNode files = objectMapper.createArrayNode();
        ObjectNode mainFile = objectMapper.createObjectNode();
        mainFile.put("name", fileName);
        mainFile.put("content", code != null ? code : "");
        files.add(mainFile);
        body.set("files", files);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        int attempt = 0;
        while (true) {
            attempt++;
            respectRateLimit();
            try {
                ResponseEntity<JsonNode> resp = restTemplate.exchange(
                        pistonApiUrl + "/execute",
                        HttpMethod.POST,
                        entity,
                        JsonNode.class
                );
                if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                    throw new RuntimeException("Piston /execute failed with status: " + resp.getStatusCode());
                }
                return resp.getBody();
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS && attempt <= maxRetries) {
                    long backoff = Math.max(minIntervalMs, minIntervalMs * attempt);
                    try { Thread.sleep(backoff); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                    continue;
                }
                throw e;
            }
        }
    }
}
