package com.cpi.cpi_backend.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/chat")
    public ResponseEntity<?> proxyChat(@RequestBody Map<String, Object> requestPayload) {
        try {
            String url = aiServiceUrl + "/api/v1/chat";
            ResponseEntity<Object> response = restTemplate.postForEntity(url, requestPayload, Object.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "reply", "Unable to connect to CPI AI Microservice: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/recommendation")
    public ResponseEntity<?> proxyRecommendation(@RequestBody Map<String, Object> requestPayload) {
        try {
            String url = aiServiceUrl + "/api/v1/recommendation";
            ResponseEntity<Object> response = restTemplate.postForEntity(url, requestPayload, Object.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "detail", "Unable to connect to CPI AI Microservice: " + e.getMessage()
            ));
        }
    }
}
