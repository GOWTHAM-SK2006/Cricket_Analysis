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
        // Fetch all players to build database player list summary
        java.util.List<com.cpi.cpi_backend.entity.Player> allPlayers = playerRepository.findAll();
        java.util.List<java.util.Map<String, Object>> allPlayersList = new java.util.ArrayList<>();
        for (com.cpi.cpi_backend.entity.Player p : allPlayers) {
            java.util.Map<String, Object> pMap = new java.util.HashMap<>();
            pMap.put("id", p.getId());
            pMap.put("name", p.getName());
            pMap.put("role", p.getRole());
            double ppi = p.getPpiScore() != null ? p.getPpiScore() : 0.0;
            double mpi = p.getMpiScore() != null ? p.getMpiScore() : 0.0;
            pMap.put("ppi", ppi);
            pMap.put("mpi", mpi);
            pMap.put("cpi", (ppi > 0 && mpi > 0) ? (ppi + mpi) / 2.0 : (ppi > 0 ? ppi : mpi));
            allPlayersList.add(pMap);
        }

        // Auto-detect player in message and inject context if not already present
        if (!requestPayload.containsKey("context") || requestPayload.get("context") == null) {
            String message = (String) requestPayload.get("message");
            java.util.Map<String, Object> context = new java.util.HashMap<>();
            context.put("allPlayersList", allPlayersList);

            if (message != null && !message.trim().isEmpty()) {
                for (com.cpi.cpi_backend.entity.Player player : allPlayers) {
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b" + java.util.regex.Pattern.quote(player.getName()) + "\\b", java.util.regex.Pattern.CASE_INSENSITIVE);
                    java.util.regex.Matcher matcher = pattern.matcher(message);
                    if (matcher.find()) {
                        log.info("Auto-detected player '{}' in chat message. Injecting database context...", player.getName());
                        
                        // Fetch assessments
                        java.util.List<com.cpi.cpi_backend.entity.PracticeAssessment> practiceAssessments = practiceAssessmentRepository.findByPlayerId(player.getId());
                        java.util.List<com.cpi.cpi_backend.entity.MatchAssessment> matchAssessments = matchAssessmentRepository.findByPlayerId(player.getId());
                        
                        context.put("playerName", player.getName());
                        context.put("age", 19);
                        context.put("role", player.getRole());
                        
                        double ppi = player.getPpiScore() != null ? player.getPpiScore() : 0.0;
                        double mpi = player.getMpiScore() != null ? player.getMpiScore() : 0.0;
                        context.put("currentPPI", ppi);
                        context.put("currentMPI", mpi);
                        context.put("currentCPI", (ppi > 0 && mpi > 0) ? (ppi + mpi) / 2.0 : (ppi > 0 ? ppi : mpi));
                        context.put("targetCPI", 90.0);
                        
                        context.put("technicalExecution", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getTechnicalExecution, com.cpi.cpi_backend.entity.MatchAssessment::getTechnicalExecution));
                        context.put("skillsLevel", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getSkillsLevel, com.cpi.cpi_backend.entity.MatchAssessment::getSkillsLevel));
                        context.put("intensity", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getIntensity, com.cpi.cpi_backend.entity.MatchAssessment::getIntensity));
                        context.put("concentration", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getConcentration, com.cpi.cpi_backend.entity.MatchAssessment::getConcentration));
                        context.put("decisionMaking", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getDecisionMaking, com.cpi.cpi_backend.entity.MatchAssessment::getDecisionMaking));
                        context.put("preparation", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getPreparation, com.cpi.cpi_backend.entity.MatchAssessment::getPreparation));
                        context.put("gameAwareness", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getGameAwareness, com.cpi.cpi_backend.entity.MatchAssessment::getGameAwareness));
                        context.put("adaptability", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getAdaptability, com.cpi.cpi_backend.entity.MatchAssessment::getAdaptability));
                        context.put("discipline", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getDiscipline, com.cpi.cpi_backend.entity.MatchAssessment::getDiscipline));
                        context.put("teamwork", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getTeamwork, com.cpi.cpi_backend.entity.MatchAssessment::getTeamwork));
                        context.put("coachability", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getCoachability, com.cpi.cpi_backend.entity.MatchAssessment::getCoachability));
                        context.put("workEthic", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getWorkEthic, com.cpi.cpi_backend.entity.MatchAssessment::getWorkEthic));
                        context.put("emotionalControl", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getEmotionalControl, com.cpi.cpi_backend.entity.MatchAssessment::getEmotionalControl));

                        java.util.List<Double> practiceHistory = practiceAssessments.stream()
                                .sorted(java.util.Comparator.comparing(com.cpi.cpi_backend.entity.PracticeAssessment::getDate))
                                .map(a -> a.getPpiScore() != null ? a.getPpiScore() : 0.0)
                                .collect(java.util.stream.Collectors.toList());
                        context.put("practiceHistory", practiceHistory);
                        
                        java.util.List<Double> matchHistory = matchAssessments.stream()
                                .sorted(java.util.Comparator.comparing(com.cpi.cpi_backend.entity.MatchAssessment::getDate))
                                .map(a -> a.getMpiScore() != null ? a.getMpiScore() : 0.0)
                                .collect(java.util.stream.Collectors.toList());
                        context.put("matchHistory", matchHistory);
                        
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
                        requestPayload.put("playerId", player.getId());
                        break;
                    }
                }
            }
            requestPayload.put("context", context);
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

    private Double getAverageMetric(
            java.util.List<com.cpi.cpi_backend.entity.PracticeAssessment> practices,
            java.util.List<com.cpi.cpi_backend.entity.MatchAssessment> matches,
            java.util.function.Function<com.cpi.cpi_backend.entity.PracticeAssessment, Integer> pracExtractor,
            java.util.function.Function<com.cpi.cpi_backend.entity.MatchAssessment, Integer> matchExtractor
    ) {
        double sum = 0.0;
        int count = 0;
        if (practices != null) {
            for (com.cpi.cpi_backend.entity.PracticeAssessment p : practices) {
                Integer val = pracExtractor.apply(p);
                if (val != null) {
                    sum += val;
                    count++;
                }
            }
        }
        if (matches != null) {
            for (com.cpi.cpi_backend.entity.MatchAssessment m : matches) {
                Integer val = matchExtractor.apply(m);
                if (val != null) {
                    sum += val;
                    count++;
                }
            }
        }
        return count > 0 ? (double) Math.round((sum / count) * 10) / 10.0 : null;
    }
}
