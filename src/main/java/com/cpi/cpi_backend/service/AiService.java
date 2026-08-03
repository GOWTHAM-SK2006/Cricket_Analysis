package com.cpi.cpi_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.PracticeAssessmentRepository;
import com.cpi.cpi_backend.repository.MatchAssessmentRepository;
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
    private final PlayerRepository playerRepository;
    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final MatchAssessmentRepository matchAssessmentRepository;

    public ResponseEntity<?> forwardChatRequest(Map<String, Object> requestPayload) {
        // Auto-detect player in message and inject context if not already present
        if (!requestPayload.containsKey("context") || requestPayload.get("context") == null) {
            String message = (String) requestPayload.get("message");
            if (message != null && !message.trim().isEmpty()) {
                java.util.List<com.cpi.cpi_backend.entity.Player> allPlayers = playerRepository.findAll();
                for (com.cpi.cpi_backend.entity.Player player : allPlayers) {
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b" + java.util.regex.Pattern.quote(player.getName()) + "\\b", java.util.regex.Pattern.CASE_INSENSITIVE);
                    java.util.regex.Matcher matcher = pattern.matcher(message);
                    if (matcher.find()) {
                        log.info("Auto-detected player '{}' in chat message. Injecting database context...", player.getName());
                        
                        // Fetch assessments
                        java.util.List<com.cpi.cpi_backend.entity.PracticeAssessment> practiceAssessments = practiceAssessmentRepository.findByPlayerId(player.getId());
                        java.util.List<com.cpi.cpi_backend.entity.MatchAssessment> matchAssessments = matchAssessmentRepository.findByPlayerId(player.getId());
                        
                        // Build context
                        java.util.Map<String, Object> context = new java.util.HashMap<>();
                        context.put("playerName", player.getName());
                        context.put("age", 19); // Default age matching UI presentation
                        context.put("role", player.getRole());
                        
                        double ppi = player.getPpiScore() != null ? player.getPpiScore() : 0.0;
                        double mpi = player.getMpiScore() != null ? player.getMpiScore() : 0.0;
                        context.put("currentPPI", ppi);
                        context.put("currentMPI", mpi);
                        context.put("currentCPI", (ppi > 0 && mpi > 0) ? (ppi + mpi) / 2.0 : (ppi > 0 ? ppi : mpi));
                        context.put("targetCPI", 90.0);
                        
                        // Sort practice assessments by date ascending and get ppiScores
                        java.util.List<Double> practiceHistory = practiceAssessments.stream()
                                .sorted(java.util.Comparator.comparing(com.cpi.cpi_backend.entity.PracticeAssessment::getDate))
                                .map(a -> a.getPpiScore() != null ? a.getPpiScore() : 0.0)
                                .collect(java.util.stream.Collectors.toList());
                        context.put("practiceHistory", practiceHistory);
                        
                        // Sort match assessments by date ascending and get mpiScores
                        java.util.List<Double> matchHistory = matchAssessments.stream()
                                .sorted(java.util.Comparator.comparing(com.cpi.cpi_backend.entity.MatchAssessment::getDate))
                                .map(a -> a.getMpiScore() != null ? a.getMpiScore() : 0.0)
                                .collect(java.util.stream.Collectors.toList());
                        context.put("matchHistory", matchHistory);
                        
                        // Collect notes as feedback
                        java.util.List<String> coachFeedback = new java.util.ArrayList<>();
                        for (com.cpi.cpi_backend.entity.PracticeAssessment a : practiceAssessments) {
                            if (a.getNotes() != null && !a.getNotes().trim().isEmpty()) {
                                coachFeedback.add(a.getNotes().trim());
                            }
                        }
                        for (com.cpi.cpi_backend.entity.MatchAssessment a : matchAssessments) {
                            if (a.getNotes() != null && !a.getNotes().trim().isEmpty()) {
                                coachFeedback.add(a.getNotes().trim());
                            }
                        }
                        context.put("coachFeedback", coachFeedback);
                        
                        requestPayload.put("context", context);
                        requestPayload.put("playerId", player.getId());
                        break; // Inject first matched player
                    }
                }
            }
        }

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
