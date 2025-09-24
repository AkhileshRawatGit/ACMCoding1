package com.code.codingplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class PistonService {

    @Value("${piston.api.url:https://emkc.org/api/v2/piston}")
    private String pistonApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, String> languageVersionCache = new HashMap<>();

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
    }
}
