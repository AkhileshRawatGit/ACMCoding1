//package com.code.codingplatform.service;
//
//import com.fasterxml.jackson.databind.JsonNode;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.fasterxml.jackson.databind.node.ObjectNode;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.*;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.HttpClientErrorException;
//import org.springframework.web.client.HttpServerErrorException;
//import org.springframework.web.client.RestTemplate;
//
//import java.util.Base64;
//
//@Service
//public class Judge0Service {
//
//    @Value("${judge0.api.url}")
//    private String judge0ApiUrl;
//
//    @Value("${judge0.api.key}")
//    private String judge0ApiKey;
//
//    @Value("${judge0.api.host}")
//    private String judge0ApiHost;
//
//    private final RestTemplate restTemplate;
//    private final ObjectMapper objectMapper;
//
//    public Judge0Service() {
//        this.restTemplate = new RestTemplate();
//        this.objectMapper = new ObjectMapper();
//    }
//
//    public JsonNode submitCode(String code, Integer languageId, String stdin) throws Exception {
//        HttpHeaders headers = new HttpHeaders();
//        headers.setContentType(MediaType.APPLICATION_JSON);
//        headers.set("X-RapidAPI-Key", judge0ApiKey);
//        headers.set("X-RapidAPI-Host", judge0ApiHost);
//
//        ObjectNode requestBody = objectMapper.createObjectNode();
//        requestBody.put("language_id", languageId);
//        requestBody.put("source_code", Base64.getEncoder().encodeToString(code.getBytes()));
//        requestBody.put("stdin", Base64.getEncoder().encodeToString(stdin.getBytes()));
//        requestBody.put("cpu_time_limit", 2); // Example limits
//        requestBody.put("memory_limit", 128000); // 128MB
//        requestBody.put("redirect_stderr_to_stdout", true); // Useful for capturing errors in stdout
//
//        HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);
//
//        try {
//            ResponseEntity<JsonNode> response = restTemplate.exchange(
//                    judge0ApiUrl + "/submissions?base64_encoded=true&wait=false", // wait=false for async submission
//                    HttpMethod.POST,
//                    entity,
//                    JsonNode.class
//            );
//            return response.getBody();
//        } catch (HttpClientErrorException | HttpServerErrorException e) {
//            System.err.println("Judge0 API Error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
//            throw new RuntimeException("Failed to submit code to Judge0: " + e.getResponseBodyAsString(), e);
//        } catch (Exception e) {
//            System.err.println("Error during Judge0 submission: " + e.getMessage());
//            throw new RuntimeException("An unexpected error occurred during Judge0 submission.", e);
//        }
//    }
//
//    public JsonNode getSubmissionResult(String token) throws Exception {
//        HttpHeaders headers = new HttpHeaders();
//        headers.set("X-RapidAPI-Key", judge0ApiKey);
//        headers.set("X-RapidAPI-Host", judge0ApiHost);
//
//        HttpEntity<String> entity = new HttpEntity<>(headers);
//
//        // Polling for result (Judge0 recommends polling)
//        JsonNode result = null;
//        String statusDescription = "";
//        long startTime = System.currentTimeMillis();
//        long timeout = 10000; // 10 seconds timeout
//
//        while (!statusDescription.equals("Accepted") &&
//                !statusDescription.equals("Compilation Error") &&
//                !statusDescription.equals("Runtime Error (NZEC)") &&
//                !statusDescription.equals("Time Limit Exceeded") &&
//                !statusDescription.equals("Memory Limit Exceeded") &&
//                !statusDescription.equals("Wrong Answer") &&
//                (System.currentTimeMillis() - startTime < timeout)) {
//
//            try {
//                ResponseEntity<JsonNode> response = restTemplate.exchange(
//                        judge0ApiUrl + "/submissions/" + token + "?base64_encoded=true&fields=stdout,stderr,compile_output,status,time,memory",
//                        HttpMethod.GET,
//                        entity,
//                        JsonNode.class
//                );
//                result = response.getBody();
//                if (result != null && result.has("status") && result.get("status").has("description")) {
//                    statusDescription = result.get("status").get("description").asText();
//                }
//                Thread.sleep(500); // Poll every 500ms
//            } catch (HttpClientErrorException | HttpServerErrorException e) {
//                System.err.println("Judge0 API Error (polling): " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
//                throw new RuntimeException("Failed to get submission result from Judge0: " + e.getResponseBodyAsString(), e);
//            } catch (InterruptedException e) {
//                Thread.currentThread().interrupt();
//                throw new RuntimeException("Polling interrupted", e);
//            }
//        }
//
//        if (result == null) {
//            throw new RuntimeException("Judge0 submission result not available within timeout.");
//        }
//        return result;
//    }
//}
//
