package com.cpi.cpi_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    @Value("${ai.service.url:https://loyal-integrity-production-47ac.up.railway.app}")
    private String aiServiceUrl;

    private final WebClient webClient;

    public ResponseEntity<?> forwardChatRequest(Map<String, Object> requestPayload) {
        String targetUrl = aiServiceUrl + "/api/v1/chat";
        log.info("Forwarding Chat Request to FastAPI AI Service at: {}", targetUrl);
        log.info("Request Payload: {}", requestPayload);

        try {
            Object responseBody = webClient.post()
                    .uri(targetUrl)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            log.info("FastAPI AI Service Status: 200 OK");
            log.info("FastAPI Response Body: {}", responseBody);
            return ResponseEntity.ok(responseBody);

        } catch (WebClientResponseException e) {
            log.error("FastAPI HTTP Error: {} - Response: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "success", false,
                            "message", "AI Service Error: " + e.getResponseBodyAsString()
                    ));
        } catch (Exception e) {
            log.error("Error communicating with FastAPI AI Service: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "success", false,
                            "message", "AI Service is temporarily unavailable."
                    ));
        }
    }

    public ResponseEntity<?> forwardRecommendationRequest(Map<String, Object> requestPayload) {
        String targetUrl = aiServiceUrl + "/api/v1/recommendation";
        log.info("Forwarding Recommendation Request to FastAPI AI Service at: {}", targetUrl);
        log.info("Request Payload: {}", requestPayload);

        try {
            Object responseBody = webClient.post()
                    .uri(targetUrl)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            log.info("FastAPI AI Recommendation Status: 200 OK");
            log.info("FastAPI Response Body: {}", responseBody);
            return ResponseEntity.ok(responseBody);

        } catch (WebClientResponseException e) {
            log.error("FastAPI HTTP Error: {} - Response: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "success", false,
                            "message", "AI Service Error: " + e.getResponseBodyAsString()
                    ));
        } catch (Exception e) {
            log.error("Error communicating with FastAPI AI Service: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "success", false,
                            "message", "AI Service is temporarily unavailable."
                    ));
        }
    }
}
