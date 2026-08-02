package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> requestPayload) {
        log.info("Received /api/ai/chat request from frontend");
        return aiService.forwardChatRequest(requestPayload);
    }

    @PostMapping("/recommendation")
    public ResponseEntity<?> recommendation(@RequestBody Map<String, Object> requestPayload) {
        log.info("Received /api/ai/recommendation request from frontend");
        return aiService.forwardRecommendationRequest(requestPayload);
    }
}
