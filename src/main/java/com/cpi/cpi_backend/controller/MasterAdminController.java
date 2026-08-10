package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.entity.*;
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
        metrics.put("totalCoaches", totalCoaches);
        metrics.put("totalPlayers", totalPlayers);
        metrics.put("totalAssessments", totalAssessments);
        metrics.put("activeCoaches", totalCoaches);
        metrics.put("activePlayers", totalPlayers);
        metrics.put("practiceAssessments", practiceCount);
        metrics.put("matchAssessments", matchCount);
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
        org1.put("coachesCount", coachRepository.count());
        org1.put("playersCount", playerRepository.count());
        org1.put("assessmentsCount", practiceAssessmentRepository.count() + matchAssessmentRepository.count());
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

        for (Coach c : allCoaches) {
            Map<String, Object> cMap = new LinkedHashMap<>();
            cMap.put("id", c.getId());
            cMap.put("name", c.getName());
            cMap.put("email", c.getEmail());
            cMap.put("role", c.getRole() != null ? c.getRole().name() : "COACH");
            cMap.put("organization", "CPI Cricket Academy");
            
            long pCount = playerRepository.findByCreatorCoachId(c.getId()).size();
            long practiceCount = practiceAssessmentRepository.findByCoachId(c.getId()).size();
            long matchCount = matchAssessmentRepository.findByCoachId(c.getId()).size();
            long totalAssessments = practiceCount + matchCount;

            cMap.put("playersCount", pCount);
            cMap.put("assessmentsCount", totalAssessments);
            cMap.put("status", c.isEnabled() ? "Active" : "Inactive");
            cMap.put("joinedDate", c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate().toString() : "2025-01-15");
            result.add(cMap);
        }

        return ResponseEntity.ok(result);
    }

    // 4. GLOBAL PLAYERS OVERVIEW
    @GetMapping("/admin/players")
    public ResponseEntity<List<Map<String, Object>>> getGlobalPlayers() {
        List<Player> allPlayers = playerRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Player p : allPlayers) {
            Map<String, Object> pMap = new LinkedHashMap<>();
            pMap.put("id", p.getId());
            pMap.put("name", p.getName());
            pMap.put("organization", "CPI Cricket Academy");
            pMap.put("coachName", p.getCreatorCoach() != null ? p.getCreatorCoach().getName() : "Unassigned");
            
            Double ppi = p.getPpiScore();
            Double mpi = p.getMpiScore();
            Double cpi = null;
            if (ppi != null && mpi != null && ppi > 0 && mpi > 0) {
                cpi = (ppi + mpi) / 2.0;
            } else if (ppi != null && ppi > 0) {
                cpi = ppi;
            } else if (mpi != null && mpi > 0) {
                cpi = mpi;
            }

            pMap.put("cpi", cpi != null && cpi > 0 ? String.format(Locale.US, "%.1f / 10", cpi > 10 ? cpi / 10.0 : cpi) : "N/A");
            pMap.put("ppi", ppi != null && ppi > 0 ? String.format(Locale.US, "%.1f / 10", ppi > 10 ? ppi / 10.0 : ppi) : "N/A");
            pMap.put("mpi", mpi != null && mpi > 0 ? String.format(Locale.US, "%.1f / 10", mpi > 10 ? mpi / 10.0 : mpi) : "N/A");
            pMap.put("lastAssessment", p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate().toString() : "N/A");
            pMap.put("status", "Active");
            result.add(pMap);
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
            String playerName = "Player";
            if (pa.getPlayer() != null) {
                playerName = pa.getPlayer().getName() != null ? pa.getPlayer().getName() : ("Player #" + pa.getPlayer().getId());
            }
            item.put("player", playerName);
            item.put("type", "Practice");
            item.put("coach", pa.getCoach() != null ? pa.getCoach().getName() : "Coach");
            Double score = pa.getPpiScore();
            item.put("cpi", score != null && score > 0 ? String.format(Locale.US, "%.1f / 10", score > 10 ? score / 10.0 : score) : "N/A");
            item.put("date", pa.getDate() != null ? pa.getDate().toString() : (pa.getCreatedAt() != null ? pa.getCreatedAt().toLocalDate().toString() : "N/A"));
            logsList.add(item);
        }

        List<MatchAssessment> mas = matchAssessmentRepository.findAll();
        for (MatchAssessment ma : mas) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", 1000 + ma.getId());
            String playerName = "Player";
            if (ma.getPlayer() != null) {
                playerName = ma.getPlayer().getName() != null ? ma.getPlayer().getName() : ("Player #" + ma.getPlayer().getId());
            }
            item.put("player", playerName);
            item.put("type", "Match");
            item.put("coach", ma.getCoach() != null ? ma.getCoach().getName() : "Coach");
            Double score = ma.getMpiScore();
            item.put("cpi", score != null && score > 0 ? String.format(Locale.US, "%.1f / 10", score > 10 ? score / 10.0 : score) : "N/A");
            item.put("date", ma.getDate() != null ? ma.getDate().toString() : (ma.getCreatedAt() != null ? ma.getCreatedAt().toLocalDate().toString() : "N/A"));
            logsList.add(item);
        }

        res.put("totalAssessments", pas.size() + mas.size());
        res.put("practiceCount", pas.size());
        res.put("matchCount", mas.size());
        res.put("recentLogs", logsList);
        return ResponseEntity.ok(res);
    }

    // 6. PLATFORM ANALYTICS
    @GetMapping("/admin/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> res = new LinkedHashMap<>();

        long totalCoaches = coachRepository.count();
        long totalPlayers = playerRepository.count();
        long practiceCount = practiceAssessmentRepository.count();
        long matchCount = matchAssessmentRepository.count();
        long totalAssessments = practiceCount + matchCount;

        long practicePct = totalAssessments > 0 ? Math.round((double) practiceCount / totalAssessments * 100) : 0;
        long matchPct = totalAssessments > 0 ? (100 - practicePct) : 0;

        res.put("totalCoaches", totalCoaches);
        res.put("totalPlayers", totalPlayers);
        res.put("practiceCount", practiceCount);
        res.put("matchCount", matchCount);
        res.put("totalAssessments", totalAssessments);
        res.put("practicePct", practicePct);
        res.put("matchPct", matchPct);

        List<Map<String, Object>> growthData = new ArrayList<>();
        Map<String, Object> p1 = new LinkedHashMap<>();
        p1.put("period", "Current Platform Status");
        p1.put("coaches", totalCoaches);
        p1.put("players", totalPlayers);
        p1.put("assessments", totalAssessments);
        growthData.add(p1);

        res.put("growthData", growthData);

        List<Map<String, Object>> topOrgs = new ArrayList<>();
        Map<String, Object> org1 = new LinkedHashMap<>();
        org1.put("name", "CPI Cricket Academy");
        org1.put("location", "Chennai");
        org1.put("logs", totalAssessments);
        org1.put("share", totalAssessments > 0 ? "100.0%" : "0.0%");
        topOrgs.add(org1);

        res.put("topOrganizations", topOrgs);
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
