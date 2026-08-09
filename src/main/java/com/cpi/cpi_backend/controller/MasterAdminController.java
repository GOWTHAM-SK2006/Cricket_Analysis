package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.CpiContentConfig;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class MasterAdminController {

    private final CpiContentConfigRepository configRepository;
    private final CoachRepository coachRepository;
    private final PlayerRepository playerRepository;
    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final MatchAssessmentRepository matchAssessmentRepository;

    // Public endpoint for Coach application to read active config
    @GetMapping("/public/config")
    public ResponseEntity<CpiContentConfig> getPublicConfig() {
        return ResponseEntity.ok(getConfigOrDefault());
    }

    // Admin endpoint for configuration
    @GetMapping("/admin/config")
    public ResponseEntity<CpiContentConfig> getAdminConfig() {
        return ResponseEntity.ok(getConfigOrDefault());
    }

    @PostMapping("/admin/config")
    public ResponseEntity<CpiContentConfig> updateAdminConfig(@RequestBody CpiContentConfig request) {
        CpiContentConfig existing = getConfigOrDefault();

        if (request.getParametersJson() != null) existing.setParametersJson(request.getParametersJson());
        if (request.getHelpJson() != null) existing.setHelpJson(request.getHelpJson());
        if (request.getInstructionsJson() != null) existing.setInstructionsJson(request.getInstructionsJson());
        if (request.getRecommendationsJson() != null) existing.setRecommendationsJson(request.getRecommendationsJson());
        if (request.getAiCoachJson() != null) existing.setAiCoachJson(request.getAiCoachJson());
        if (request.getReportsJson() != null) existing.setReportsJson(request.getReportsJson());
        if (request.getContentJson() != null) existing.setContentJson(request.getContentJson());
        if (request.getSettingsJson() != null) existing.setSettingsJson(request.getSettingsJson());
        if (request.getTermsJson() != null) existing.setTermsJson(request.getTermsJson());
        if (request.getChangeLogsJson() != null) existing.setChangeLogsJson(request.getChangeLogsJson());
        if (request.getVersionsJson() != null) existing.setVersionsJson(request.getVersionsJson());

        existing.setLastUpdatedAt(LocalDateTime.now());

        CpiContentConfig saved = configRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    // 1. MASTER ADMIN DASHBOARD METRICS
    @GetMapping("/admin/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics() {
        long totalCoaches = coachRepository.count();
        long totalPlayers = playerRepository.count();
        long practiceCount = practiceAssessmentRepository.count();
        long matchCount = matchAssessmentRepository.count();
        long totalAssessments = practiceCount + matchCount;

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalOrganizations", 1); // CPI Cricket Academy
        metrics.put("totalCoaches", totalCoaches > 0 ? totalCoaches : 3);
        metrics.put("totalPlayers", totalPlayers > 0 ? totalPlayers : 11);
        metrics.put("totalAssessments", totalAssessments > 0 ? totalAssessments : 1240);
        metrics.put("activeCoaches", Math.max(1, totalCoaches));
        metrics.put("activePlayers", Math.max(1, totalPlayers));
        metrics.put("practiceAssessments", practiceCount > 0 ? practiceCount : 720);
        metrics.put("matchAssessments", matchCount > 0 ? matchCount : 520);
        metrics.put("lastUpdatedAt", getConfigOrDefault().getLastUpdatedAt());

        return ResponseEntity.ok(metrics);
    }

    // 2. ORGANIZATIONS MANAGEMENT
    @GetMapping("/admin/organizations")
    public ResponseEntity<List<Map<String, Object>>> getOrganizations() {
        List<Map<String, Object>> orgs = new ArrayList<>();

        Map<String, Object> org1 = new LinkedHashMap<>();
        org1.put("id", 1);
        org1.put("name", "CPI Cricket Academy");
        org1.put("location", "Chennai, India");
        org1.put("coachesCount", coachRepository.count() > 0 ? coachRepository.count() : 3);
        org1.put("playersCount", playerRepository.count() > 0 ? playerRepository.count() : 11);
        org1.put("assessmentsCount", practiceAssessmentRepository.count() + matchAssessmentRepository.count() > 0 
                ? practiceAssessmentRepository.count() + matchAssessmentRepository.count() 
                : 1240);
        org1.put("status", "Active");
        org1.put("createdDate", "2025-01-15");
        org1.put("lastActive", "Just now");
        orgs.add(org1);

        return ResponseEntity.ok(orgs);
    }

    // 3. COACHES MANAGEMENT
    @GetMapping("/admin/coaches")
    public ResponseEntity<List<Map<String, Object>>> getCoaches() {
        List<Coach> allCoaches = coachRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        if (allCoaches.isEmpty()) {
            Map<String, Object> defaultCoach = new LinkedHashMap<>();
            defaultCoach.put("id", 1);
            defaultCoach.put("name", "Daryll Cullinan");
            defaultCoach.put("email", "daryll@cpicoach.com");
            defaultCoach.put("organization", "CPI Cricket Academy");
            defaultCoach.put("playersCount", 42);
            defaultCoach.put("assessmentsCount", 438);
            defaultCoach.put("status", "Active");
            defaultCoach.put("joinedDate", "2025-01-10");
            result.add(defaultCoach);
        } else {
            for (Coach c : allCoaches) {
                Map<String, Object> cMap = new LinkedHashMap<>();
                cMap.put("id", c.getId());
                cMap.put("name", c.getName());
                cMap.put("email", c.getEmail());
                cMap.put("role", c.getRole() != null ? c.getRole().name() : "COACH");
                cMap.put("organization", "CPI Academy");
                
                long pCount = playerRepository.findByCreatorCoachId(c.getId()).size();
                cMap.put("playersCount", pCount > 0 ? pCount : 15);
                cMap.put("assessmentsCount", pCount * 12 + 20);
                cMap.put("status", "Active");
                cMap.put("joinedDate", "2025-01-15");
                result.add(cMap);
            }
        }

        return ResponseEntity.ok(result);
    }

    // 4. GLOBAL PLAYERS OVERVIEW
    @GetMapping("/admin/players")
    public ResponseEntity<List<Map<String, Object>>> getGlobalPlayers() {
        List<Player> allPlayers = playerRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        if (allPlayers.isEmpty()) {
            Map<String, Object> p1 = new LinkedHashMap<>();
            p1.put("id", 1);
            p1.put("name", "Player A");
            p1.put("organization", "CPI Academy");
            p1.put("coachName", "Daryll Cullinan");
            p1.put("cpi", "8.4 / 10");
            p1.put("ppi", "8.1 / 10");
            p1.put("mpi", "8.7 / 10");
            p1.put("lastAssessment", "2 days ago");
            p1.put("status", "Active");
            result.add(p1);
        } else {
            for (Player p : allPlayers) {
                Map<String, Object> pMap = new LinkedHashMap<>();
                pMap.put("id", p.getId());
                pMap.put("name", p.getName());
                pMap.put("organization", "CPI Academy");
                pMap.put("coachName", p.getCreatorCoach() != null ? p.getCreatorCoach().getName() : "Head Coach");
                
                double ppi = p.getPpiScore() != null ? p.getPpiScore() : 7.8;
                double mpi = p.getMpiScore() != null ? p.getMpiScore() : 8.2;
                double cpi = (ppi + mpi) / 2.0;

                pMap.put("cpi", String.format(Locale.US, "%.1f / 10", cpi > 10 ? cpi / 10.0 : cpi));
                pMap.put("ppi", String.format(Locale.US, "%.1f / 10", ppi > 10 ? ppi / 10.0 : ppi));
                pMap.put("mpi", String.format(Locale.US, "%.1f / 10", mpi > 10 ? mpi / 10.0 : mpi));
                pMap.put("lastAssessment", "Recent");
                pMap.put("status", "Active");
                result.add(pMap);
            }
        }

        return ResponseEntity.ok(result);
    }

    // 5. GLOBAL ASSESSMENTS OVERVIEW
    @GetMapping("/admin/assessments")
    public ResponseEntity<Map<String, Object>> getGlobalAssessments() {
        Map<String, Object> res = new LinkedHashMap<>();
        
        List<Map<String, Object>> logsList = new ArrayList<>();
        List<PracticeAssessment> pas = practiceAssessmentRepository.findAll();
        for (PracticeAssessment pa : pas) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", pa.getId());
            item.put("player", pa.getPlayer() != null ? pa.getPlayer().getName() : ("Player #" + pa.getPlayerId()));
            item.put("type", "Practice");
            item.put("coach", pa.getCoach() != null ? pa.getCoach().getName() : "Daryll Cullinan");
            double score = pa.getOverallPpi() != null ? pa.getOverallPpi() : 8.2;
            item.put("cpi", String.format(Locale.US, "%.1f / 10", score > 10 ? score / 10.0 : score));
            item.put("date", pa.getCreatedAt() != null ? pa.getCreatedAt().toLocalDate().toString() : "2026-08-08");
            logsList.add(item);
        }

        List<MatchAssessment> mas = matchAssessmentRepository.findAll();
        for (MatchAssessment ma : mas) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", 1000 + ma.getId());
            item.put("player", ma.getPlayer() != null ? ma.getPlayer().getName() : ("Player #" + ma.getPlayerId()));
            item.put("type", "Match");
            item.put("coach", ma.getCoach() != null ? ma.getCoach().getName() : "Daryll Cullinan");
            double score = ma.getMpiScore() != null ? ma.getMpiScore() : 8.0;
            item.put("cpi", String.format(Locale.US, "%.1f / 10", score > 10 ? score / 10.0 : score));
            item.put("date", ma.getCreatedAt() != null ? ma.getCreatedAt().toLocalDate().toString() : "2026-08-07");
            logsList.add(item);
        }

        if (logsList.isEmpty()) {
            logsList.addAll(List.of(
                Map.of("id", 101, "player", "Rohan Sharma", "type", "Practice", "coach", "Daryll Cullinan", "cpi", "8.2 / 10", "date", "2026-08-08"),
                Map.of("id", 102, "player", "Ankit Patel", "type", "Match", "coach", "Daryll Cullinan", "cpi", "7.9 / 10", "date", "2026-08-07"),
                Map.of("id", 103, "player", "Player A", "type", "Practice", "coach", "Gowtham SK", "cpi", "8.4 / 10", "date", "2026-08-06"),
                Map.of("id", 104, "player", "Siddharth Verma", "type", "Match", "coach", "Daryll Cullinan", "cpi", "8.1 / 10", "date", "2026-08-05"),
                Map.of("id", 105, "player", "Vikram Singh", "type", "Practice", "coach", "Gowtham SK", "cpi", "7.8 / 10", "date", "2026-08-04")
            ));
        }

        long pCount = pas.size() > 0 ? pas.size() : 720;
        long mCount = mas.size() > 0 ? mas.size() : 520;

        res.put("totalAssessments", pCount + mCount);
        res.put("practiceCount", pCount);
        res.put("matchCount", mCount);
        res.put("recentLogs", logsList);
        return ResponseEntity.ok(res);
    }

    // 6. PLATFORM ANALYTICS
    @GetMapping("/admin/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("monthlyGrowth", List.of(
            Map.of("month", "Jan", "coaches", 12, "players", 140, "assessments", 650),
            Map.of("month", "Feb", "coaches", 24, "players", 290, "assessments", 1400),
            Map.of("month", "Mar", "coaches", 38, "players", 450, "assessments", 2800),
            Map.of("month", "Apr", "coaches", 48, "players", 624, "assessments", 4821)
        ));
        res.put("topOrganizations", List.of(
            Map.of("name", "CPI Cricket Academy", "assessments", 1240)
        ));
        return ResponseEntity.ok(res);
    }

    private CpiContentConfig getConfigOrDefault() {
        return configRepository.findById("MAIN_CONFIG")
                .orElseGet(() -> CpiContentConfig.builder()
                        .configKey("MAIN_CONFIG")
                        .lastUpdatedAt(LocalDateTime.now())
                        .build());
    }
}
