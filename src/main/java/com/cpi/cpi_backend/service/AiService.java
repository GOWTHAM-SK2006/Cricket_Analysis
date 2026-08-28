package com.cpi.cpi_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.cpi.cpi_backend.repository.CoachRepository;
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

    @Value("${ai.service.url:https://innovative-gratitude-production-1375.up.railway.app}")
    private String aiServiceUrl;

    private final WebClient webClient;
    private final PlayerRepository playerRepository;
    private final CoachRepository coachRepository;
    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final MatchAssessmentRepository matchAssessmentRepository;
    private final com.cpi.cpi_backend.repository.CpiContentConfigRepository cpiContentConfigRepository;

    private static final Map<String, Object> DEFAULT_ADMIN_DIRECTIVES = Map.of(
        "systemInstructions", "You are the CPI AI Head Performance Analyst. Provide objective, evidence-based performance feedback for cricket players using ONLY the exact wording from the CPI 7-parameter framework. DO NOT generate, display, or reference any Coach's Summary or 'THE COACH'S SUMMARY' sections anywhere.",
        "coachingTone", "Professional, encouraging, analytical, and actionable.",
        "responseGuidance", "Format outputs clearly using exact parameter headings (HOW TO COACH TECHNIQUE, HOW TO COACH SKILL LEVEL, HOW TO COACH GAME PLAN, HOW TO COACH PREPARATION, HOW TO COACH INTENSITY, HOW TO COACH FOCUS, HOW TO COACH RESILIENCE). Do not generate any 'THE COACH'S SUMMARY' sections.",
        "recommendationBehaviour", "Outputs must contain ONLY exact sentences from CPI_7_Parameters_Practice_And_Match_Separate.txt. Do not paraphrase, rewrite, or add any Coach's Summary."
    );

    private volatile Map<String, Object> cachedAdminDirectives = null;

    public void clearAdminDirectivesCache() {
        this.cachedAdminDirectives = null;
        log.info("Cleared AiService admin directives cache.");
    }

    public Map<String, Object> getLatestAdminDirectives() {
        if (cachedAdminDirectives != null) {
            return cachedAdminDirectives;
        }
        try {
            if (cpiContentConfigRepository != null) {
                java.util.Optional<com.cpi.cpi_backend.entity.CpiContentConfig> configOpt = cpiContentConfigRepository.findAll().stream().findFirst();
                if (configOpt.isPresent() && configOpt.get().getAiCoachJson() != null && !configOpt.get().getAiCoachJson().trim().isEmpty()) {
                    String jsonStr = configOpt.get().getAiCoachJson();
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    @SuppressWarnings("unchecked")
                    Map<String, Object> parsed = mapper.readValue(jsonStr, Map.class);
                    if (parsed != null && !parsed.isEmpty()) {
                        cachedAdminDirectives = parsed;
                        return cachedAdminDirectives;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not load aiCoachJson from database, falling back to default directives: {}", e.getMessage());
        }
        cachedAdminDirectives = DEFAULT_ADMIN_DIRECTIVES;
        return cachedAdminDirectives;
    }

    public ResponseEntity<?> forwardChatRequest(Map<String, Object> requestPayload, com.cpi.cpi_backend.entity.Coach currentCoach) {
        // Fetch players under current coach to build database player list summary safely
        java.util.List<java.util.Map<String, Object>> allPlayersList = new java.util.ArrayList<>();
        java.util.List<com.cpi.cpi_backend.entity.Player> allPlayers = new java.util.ArrayList<>();
        try {
            if (currentCoach != null && currentCoach.getId() != null) {
                com.cpi.cpi_backend.entity.Coach managedCoach = coachRepository.findById(currentCoach.getId()).orElse(currentCoach);
                allPlayers = playerRepository.findByCreatorCoachId(managedCoach.getId());
            } else {
                allPlayers = new java.util.ArrayList<>();
            }

            if (allPlayers != null) {
                for (com.cpi.cpi_backend.entity.Player p : allPlayers) {
                    if (p == null || p.getName() == null) continue;
                    java.util.Map<String, Object> pMap = new java.util.HashMap<>();
                    pMap.put("id", p.getId());
                    pMap.put("name", p.getName());
                    pMap.put("role", p.getRole() != null ? p.getRole() : "N/A");
                    double ppi = p.getPpiScore() != null ? p.getPpiScore() : 0.0;
                    double mpi = p.getMpiScore() != null ? p.getMpiScore() : 0.0;
                    pMap.put("ppi", ppi);
                    pMap.put("mpi", mpi);
                    pMap.put("cpi", (ppi > 0 && mpi > 0) ? (ppi + mpi) / 2.0 : (ppi > 0 ? ppi : mpi));
                    allPlayersList.add(pMap);
                }
            }
        } catch (Exception ex) {
            log.warn("Could not load players summary for AI context: {}", ex.getMessage());
        }

        // Auto-detect player in message and inject context if not already present
        if (!requestPayload.containsKey("context") || requestPayload.get("context") == null) {
            String message = (String) requestPayload.get("message");
            java.util.Map<String, Object> context = new java.util.HashMap<>();
            context.put("allPlayersList", allPlayersList);

            if (message != null && !message.trim().isEmpty()) {
                for (com.cpi.cpi_backend.entity.Player player : allPlayers) {
                    if (player == null || player.getName() == null || player.getName().trim().isEmpty()) continue;
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b" + java.util.regex.Pattern.quote(player.getName().trim()) + "\\b", java.util.regex.Pattern.CASE_INSENSITIVE);
                    java.util.regex.Matcher matcher = pattern.matcher(message);
                    if (matcher.find()) {
                        log.info("Auto-detected player '{}' in chat message. Injecting database context...", player.getName());
                        
                        try {
                            // Fetch assessments
                            java.util.List<com.cpi.cpi_backend.entity.PracticeAssessment> practiceAssessments = practiceAssessmentRepository.findByPlayerId(player.getId());
                            java.util.List<com.cpi.cpi_backend.entity.MatchAssessment> matchAssessments = matchAssessmentRepository.findByPlayerId(player.getId());
                            
                            context.put("playerName", player.getName());
                            context.put("age", 19);
                            context.put("role", player.getRole() != null ? player.getRole() : "Player");
                            
                            double ppi = player.getPpiScore() != null ? player.getPpiScore() : 0.0;
                            double mpi = player.getMpiScore() != null ? player.getMpiScore() : 0.0;
                            context.put("currentPPI", ppi);
                            context.put("currentMPI", mpi);
                            context.put("currentCPI", (ppi > 0 && mpi > 0) ? (ppi + mpi) / 2.0 : (ppi > 0 ? ppi : mpi));
                            context.put("targetCPI", 90.0);
                            
                            if (practiceAssessments == null) practiceAssessments = java.util.Collections.emptyList();
                            if (matchAssessments == null) matchAssessments = java.util.Collections.emptyList();

                            context.put("technicalExecution", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getTechnicalExecution, com.cpi.cpi_backend.entity.MatchAssessment::getTechnicalExecution));
                            context.put("skillsLevel", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getSkillsLevel, com.cpi.cpi_backend.entity.MatchAssessment::getSkillsLevel));
                            context.put("gamePlan", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getGamePlan, com.cpi.cpi_backend.entity.MatchAssessment::getGamePlan));
                            context.put("preparation", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getPreparation, com.cpi.cpi_backend.entity.MatchAssessment::getPreparation));
                            context.put("intensity", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getIntensity, com.cpi.cpi_backend.entity.MatchAssessment::getIntensity));
                            context.put("focus", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getFocus, com.cpi.cpi_backend.entity.MatchAssessment::getFocus));
                            context.put("resilience", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getResilience, com.cpi.cpi_backend.entity.MatchAssessment::getResilience));
                            context.put("concentration", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getConcentration, com.cpi.cpi_backend.entity.MatchAssessment::getConcentration));
                            context.put("decisionMaking", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getDecisionMaking, com.cpi.cpi_backend.entity.MatchAssessment::getDecisionMaking));
                            context.put("gameAwareness", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getGameAwareness, com.cpi.cpi_backend.entity.MatchAssessment::getGameAwareness));
                            context.put("adaptability", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getAdaptability, com.cpi.cpi_backend.entity.MatchAssessment::getAdaptability));
                            context.put("discipline", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getDiscipline, com.cpi.cpi_backend.entity.MatchAssessment::getDiscipline));
                            context.put("teamwork", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getTeamwork, com.cpi.cpi_backend.entity.MatchAssessment::getTeamwork));
                            context.put("coachability", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getCoachability, com.cpi.cpi_backend.entity.MatchAssessment::getCoachability));
                            context.put("workEthic", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getWorkEthic, com.cpi.cpi_backend.entity.MatchAssessment::getWorkEthic));
                            context.put("emotionalControl", getAverageMetric(practiceAssessments, matchAssessments, com.cpi.cpi_backend.entity.PracticeAssessment::getEmotionalControl, com.cpi.cpi_backend.entity.MatchAssessment::getEmotionalControl));

                            java.util.List<Double> practiceHistory = practiceAssessments.stream()
                                    .filter(a -> a != null)
                                    .map(a -> a.getPpiScore() != null ? a.getPpiScore() : 0.0)
                                    .collect(java.util.stream.Collectors.toList());
                            context.put("practiceHistory", practiceHistory);
                            
                            java.util.List<Double> matchHistory = matchAssessments.stream()
                                    .filter(a -> a != null)
                                    .map(a -> a.getMpiScore() != null ? a.getMpiScore() : 0.0)
                                    .collect(java.util.stream.Collectors.toList());
                            context.put("matchHistory", matchHistory);
                            
                            java.util.List<String> coachFeedback = new java.util.ArrayList<>();
                            for (com.cpi.cpi_backend.entity.PracticeAssessment a : practiceAssessments) {
                                if (a != null && a.getNotes() != null && !a.getNotes().trim().isEmpty()) {
                                    coachFeedback.add(a.getNotes().trim());
                                }
                            }
                            for (com.cpi.cpi_backend.entity.MatchAssessment a : matchAssessments) {
                                if (a != null && a.getNotes() != null && !a.getNotes().trim().isEmpty()) {
                                    coachFeedback.add(a.getNotes().trim());
                                }
                            }
                            context.put("coachFeedback", coachFeedback);
                            requestPayload.put("playerId", player.getId());
                        } catch (Exception ex) {
                            log.error("Error building context for player {}: {}", player.getName(), ex.getMessage());
                        }
                        break;
                    }
                }
            }
            requestPayload.put("context", context);
        }

        String baseUrl = aiServiceUrl != null && aiServiceUrl.endsWith("/") 
                ? aiServiceUrl.substring(0, aiServiceUrl.length() - 1) 
                : aiServiceUrl;
        String targetUrl = baseUrl + "/api/v1/chat";
        requestPayload.put("adminDirectives", getLatestAdminDirectives());
        log.info("Forwarding Chat Request to FastAPI AI Service at: {}", targetUrl);
        log.info("Request Payload: {}", requestPayload);

        try {
            Object responseBody = webClient.post()
                    .uri(targetUrl)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .timeout(Duration.ofSeconds(20))
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
        String baseUrl = aiServiceUrl != null && aiServiceUrl.endsWith("/") 
                ? aiServiceUrl.substring(0, aiServiceUrl.length() - 1) 
                : aiServiceUrl;
        String targetUrl = baseUrl + "/api/v1/recommendation";
        requestPayload.put("adminDirectives", getLatestAdminDirectives());
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

    public ResponseEntity<?> forwardPersonalizationRequest(Map<String, Object> requestPayload) {
        String baseUrl = aiServiceUrl != null && aiServiceUrl.endsWith("/") 
                ? aiServiceUrl.substring(0, aiServiceUrl.length() - 1) 
                : aiServiceUrl;
        String targetUrl = baseUrl + "/api/v1/recommendation/personalize";
        requestPayload.put("adminDirectives", getLatestAdminDirectives());
        log.info("Forwarding Personalization Request to FastAPI AI Service at: {}", targetUrl);
        log.info("Request Payload: {}", requestPayload);

        try {
            Object responseBody = webClient.post()
                    .uri(targetUrl)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            log.info("FastAPI AI Personalization Status: 200 OK");
            return ResponseEntity.ok(responseBody);

        } catch (WebClientResponseException e) {
            log.error("FastAPI Personalization HTTP Error: {} - Response: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "success", false,
                            "message", "AI Personalization Error: " + e.getResponseBodyAsString()
                    ));
        } catch (Exception e) {
            log.error("Error communicating with FastAPI AI Personalization Service: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "success", false,
                            "message", "AI Personalization Service is temporarily unavailable."
                    ));
        }
    }

    public ResponseEntity<?> forwardCoachNotesSummaryRequest(Map<String, Object> requestPayload, com.cpi.cpi_backend.entity.Coach currentCoach) {
        try {
            Object playerIdObj = requestPayload.get("playerId");
            String assessmentType = (String) requestPayload.get("assessmentType");
            if (playerIdObj == null || assessmentType == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "playerId and assessmentType are required."));
            }

            Long playerId = Long.parseLong(playerIdObj.toString());
            com.cpi.cpi_backend.entity.Player player = playerRepository.findById(playerId).orElse(null);
            if (player == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Player not found."));
            }

            java.util.List<Map<String, Object>> notesList = new java.util.ArrayList<>();
            String normalizedType = assessmentType.trim().toUpperCase();

            if ("PRACTICE".equals(normalizedType)) {
                java.util.List<com.cpi.cpi_backend.entity.PracticeAssessment> practices = practiceAssessmentRepository.findByPlayerId(playerId);
                if (practices != null) {
                    for (com.cpi.cpi_backend.entity.PracticeAssessment p : practices) {
                        if (p != null && p.getNotes() != null && !p.getNotes().trim().isEmpty()) {
                            java.util.Map<String, Object> noteMap = new java.util.HashMap<>();
                            noteMap.put("date", p.getDate() != null ? p.getDate().toString() : "Unknown");
                            noteMap.put("notes", p.getNotes().trim());
                            noteMap.put("score", p.getPpiScore() != null ? p.getPpiScore() : 0.0);
                            notesList.add(noteMap);
                        }
                    }
                }
            } else if ("MATCH".equals(normalizedType)) {
                java.util.List<com.cpi.cpi_backend.entity.MatchAssessment> matches = matchAssessmentRepository.findByPlayerId(playerId);
                if (matches != null) {
                    for (com.cpi.cpi_backend.entity.MatchAssessment m : matches) {
                        if (m != null && m.getNotes() != null && !m.getNotes().trim().isEmpty()) {
                            java.util.Map<String, Object> noteMap = new java.util.HashMap<>();
                            noteMap.put("date", m.getDate() != null ? m.getDate().toString() : "Unknown");
                            noteMap.put("notes", m.getNotes().trim());
                            noteMap.put("score", m.getMpiScore() != null ? m.getMpiScore() : 0.0);
                            notesList.add(noteMap);
                        }
                    }
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid assessmentType. Use 'PRACTICE' or 'MATCH'."));
            }

            Map<String, Object> aiPayload = new java.util.HashMap<>();
            aiPayload.put("playerName", player.getName());
            aiPayload.put("assessmentType", "PRACTICE".equals(normalizedType) ? "Practice" : "Match");
            aiPayload.put("notesList", notesList);
            aiPayload.put("adminDirectives", getLatestAdminDirectives());

            String baseUrl = aiServiceUrl != null && aiServiceUrl.endsWith("/") 
                    ? aiServiceUrl.substring(0, aiServiceUrl.length() - 1) 
                    : aiServiceUrl;
            String targetUrl = baseUrl + "/api/v1/notes-summary";
            log.info("Forwarding Notes Summary Request for player '{}' ({}) to FastAPI AI Service at: {}", player.getName(), normalizedType, targetUrl);

            Object responseBody = webClient.post()
                    .uri(targetUrl)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(aiPayload)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .timeout(Duration.ofSeconds(20))
                    .block();

            return ResponseEntity.ok(responseBody);

        } catch (WebClientResponseException e) {
            log.error("FastAPI Notes Summary HTTP Error: {} - Response: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "success", false,
                            "message", "AI Notes Summary Service Error: " + e.getResponseBodyAsString()
                    ));
        } catch (Exception e) {
            log.error("Error communicating with FastAPI AI Notes Summary Service: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "success", false,
                            "message", "AI Notes Summary Service is temporarily unavailable."
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
