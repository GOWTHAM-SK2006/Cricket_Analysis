package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.DashboardStatsResponse;
import com.cpi.cpi_backend.entity.*;
import com.cpi.cpi_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cpi.cpi_backend.config.CacheNames;
import org.springframework.cache.annotation.Cacheable;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final PlayerRepository playerRepository;
    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final MatchAssessmentRepository matchAssessmentRepository;
    private final CoachRepository coachRepository;

    @GetMapping("/stats")
    @Cacheable(value = CacheNames.DASHBOARD_STATS, key = "'coach:' + #currentCoach.id")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @AuthenticationPrincipal Coach currentCoach
    ) {
        if (currentCoach == null || currentCoach.getId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Unauthorized"
            );
        }
        Long coachId = currentCoach.getId();
        Coach managedCoach = coachRepository.findById(coachId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Coach not found"
                ));

        List<Player> players = new ArrayList<>(playerRepository.findByCreatorCoachId(coachId));
        List<PracticeAssessment> practiceAssessments = new ArrayList<>(practiceAssessmentRepository.findByCoachId(coachId));
        List<MatchAssessment> matchAssessments = new ArrayList<>(matchAssessmentRepository.findByCoachId(coachId));

        if (players.isEmpty() && playerRepository.count() > 0) {
            players = new ArrayList<>(playerRepository.findAll());
        }
        if (practiceAssessments.isEmpty() && practiceAssessmentRepository.count() > 0) {
            practiceAssessments = new ArrayList<>(practiceAssessmentRepository.findAll());
        }
        if (matchAssessments.isEmpty() && matchAssessmentRepository.count() > 0) {
            matchAssessments = new ArrayList<>(matchAssessmentRepository.findAll());
        }

        System.out.println(String.format(
            "[DIAGNOSTIC LOG] Endpoint: GET /api/dashboard/stats | User Email: %s | Coach ID: %d | Records: %d players, %d practice, %d matches",
            managedCoach.getEmail(), coachId, players.size(), practiceAssessments.size(), matchAssessments.size()
        ));

        // Compute Card Stats
        long totalPlayers = players.size();
        long totalPracticeSessions = practiceAssessments.size();
        long totalMatches = matchAssessments.size();

        double avgPpi = players.stream()
                .filter(p -> p.getPpiScore() != null && p.getPpiScore() > 0)
                .mapToDouble(Player::getPpiScore)
                .average()
                .orElse(0.0);

        double avgMpi = players.stream()
                .filter(p -> p.getMpiScore() != null && p.getMpiScore() > 0)
                .mapToDouble(Player::getMpiScore)
                .average()
                .orElse(0.0);

        double avgCpi = players.stream()
                .filter(p -> p.getPpiScore() != null || p.getMpiScore() != null)
                .mapToDouble(p -> {
                    double ppi = p.getPpiScore() != null ? p.getPpiScore() : 0.0;
                    double mpi = p.getMpiScore() != null ? p.getMpiScore() : 0.0;
                    if (ppi > 0 && mpi > 0) return (ppi + mpi) / 2.0;
                    return ppi > 0 ? ppi : mpi;
                })
                .average()
                .orElse(0.0);

        // Trend Chart Data (Format: Jun 19)
        DateTimeFormatter df = DateTimeFormatter.ofPattern("MMM dd");

        Map<java.time.LocalDate, List<Double>> practiceByDate = new HashMap<>();
        for (PracticeAssessment pa : practiceAssessments) {
            if (pa.getDate() != null && pa.getPpiScore() != null) {
                practiceByDate.computeIfAbsent(pa.getDate(), k -> new ArrayList<>()).add(pa.getPpiScore());
            }
        }

        Map<java.time.LocalDate, List<Double>> matchByDate = new HashMap<>();
        for (MatchAssessment ma : matchAssessments) {
            if (ma.getDate() != null && ma.getMpiScore() != null) {
                matchByDate.computeIfAbsent(ma.getDate(), k -> new ArrayList<>()).add(ma.getMpiScore());
            }
        }

        Set<java.time.LocalDate> allDatesSet = new HashSet<>(practiceByDate.keySet());
        allDatesSet.addAll(matchByDate.keySet());
        List<java.time.LocalDate> uniqueDates = new ArrayList<>(allDatesSet);
        uniqueDates.sort(Comparator.naturalOrder());

        List<DashboardStatsResponse.TrendDto> practiceTrend = new ArrayList<>();
        List<DashboardStatsResponse.TrendDto> matchTrend = new ArrayList<>();
        List<DashboardStatsResponse.TrendDto> cpiTrend = new ArrayList<>();

        Double lastPpi = null;
        Double lastMpi = null;

        for (java.time.LocalDate date : uniqueDates) {
            String label = date.format(df);

            List<Double> pList = practiceByDate.get(date);
            if (pList != null && !pList.isEmpty()) {
                lastPpi = pList.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            }

            List<Double> mList = matchByDate.get(date);
            if (mList != null && !mList.isEmpty()) {
                lastMpi = mList.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            }

            practiceTrend.add(new DashboardStatsResponse.TrendDto(label, lastPpi != null ? lastPpi : 0.0));
            matchTrend.add(new DashboardStatsResponse.TrendDto(label, lastMpi != null ? lastMpi : 0.0));

            double cpiVal = 0.0;
            if (lastPpi != null && lastMpi != null) {
                cpiVal = (lastPpi + lastMpi) / 2.0;
            } else if (lastPpi != null) {
                cpiVal = lastPpi;
            } else if (lastMpi != null) {
                cpiVal = lastMpi;
            }
            cpiTrend.add(new DashboardStatsResponse.TrendDto(label, cpiVal));
        }

        // Limit trends to last 10 points
        if (practiceTrend.size() > 10) {
            practiceTrend = practiceTrend.subList(practiceTrend.size() - 10, practiceTrend.size());
            matchTrend = matchTrend.subList(matchTrend.size() - 10, matchTrend.size());
            cpiTrend = cpiTrend.subList(cpiTrend.size() - 10, cpiTrend.size());
        }

        // Activity Feed
        List<DashboardStatsResponse.ActivityDto> activities = new ArrayList<>();

        for (Player player : players) {
            activities.add(DashboardStatsResponse.ActivityDto.builder()
                    .type("PLAYER_ADDED")
                    .title("Player Added")
                    .description("Player '" + player.getName() + "' was added.")
                    .timestamp(player.getCreatedAt())
                    .build());
        }

        for (PracticeAssessment pa : practiceAssessments) {
            activities.add(DashboardStatsResponse.ActivityDto.builder()
                    .type("PRACTICE_COMPLETED")
                    .title("Practice Completed")
                    .description("Scored " + pa.getPlayer().getName() + " with " + String.format("%.1f", pa.getPpiScore()) + " PPI.")
                    .timestamp(pa.getCreatedAt())
                    .build());
        }

        for (MatchAssessment ma : matchAssessments) {
            activities.add(DashboardStatsResponse.ActivityDto.builder()
                    .type("MATCH_RECORDED")
                    .title("Match Recorded")
                    .description("Scored " + ma.getPlayer().getName() + " with " + String.format("%.1f", ma.getMpiScore()) + " MPI.")
                    .timestamp(ma.getCreatedAt())
                    .build());
        }

        List<DashboardStatsResponse.ActivityDto> sortedActivities = activities.stream()
                .filter(a -> a.getTimestamp() != null)
                .sorted(Comparator.comparing(DashboardStatsResponse.ActivityDto::getTimestamp).reversed())
                .limit(10)
                .collect(Collectors.toList());

        // Redesigned dashboard metrics: Today's Snapshot
        java.time.LocalDate today = java.time.LocalDate.now();

        long practicesToday = practiceAssessments.stream()
                .filter(pa -> pa.getDate() != null && pa.getDate().equals(today))
                .count();

        long matchesToday = matchAssessments.stream()
                .filter(ma -> ma.getDate() != null && ma.getDate().equals(today))
                .count();

        java.util.Set<Long> playersAssessedTodayIds = new java.util.HashSet<>();
        practiceAssessments.stream()
                .filter(pa -> pa.getDate() != null && pa.getDate().equals(today))
                .map(pa -> pa.getPlayer().getId())
                .forEach(playersAssessedTodayIds::add);
        matchAssessments.stream()
                .filter(ma -> ma.getDate() != null && ma.getDate().equals(today))
                .map(ma -> ma.getPlayer().getId())
                .forEach(playersAssessedTodayIds::add);
        long playersAssessedToday = playersAssessedTodayIds.size();

        // Recent Assessments
        List<DashboardStatsResponse.RecentAssessmentDto> recentAssessments = new ArrayList<>();
        for (PracticeAssessment pa : practiceAssessments) {
            recentAssessments.add(DashboardStatsResponse.RecentAssessmentDto.builder()
                    .playerName(pa.getPlayer().getName())
                    .assessmentType("PRACTICE")
                    .score(pa.getPpiScore())
                    .date(pa.getCreatedAt())
                    .build());
        }
        for (MatchAssessment ma : matchAssessments) {
            recentAssessments.add(DashboardStatsResponse.RecentAssessmentDto.builder()
                    .playerName(ma.getPlayer().getName())
                    .assessmentType("MATCH")
                    .score(ma.getMpiScore())
                    .date(ma.getCreatedAt())
                    .build());
        }
        recentAssessments.sort((a, b) -> {
            if (a.getDate() == null && b.getDate() == null) return 0;
            if (a.getDate() == null) return 1;
            if (b.getDate() == null) return -1;
            return b.getDate().compareTo(a.getDate());
        });
        if (recentAssessments.size() > 20) {
            recentAssessments = recentAssessments.subList(0, 20);
        }

        // Players Needing Attention & Top Performers
        List<DashboardStatsResponse.PlayerPerformanceDto> playerPerformances = players.stream()
                .map(p -> {
                    double ppi = p.getPpiScore() != null ? p.getPpiScore() : 0.0;
                    double mpi = p.getMpiScore() != null ? p.getMpiScore() : 0.0;
                    double cpiVal = 0.0;
                    if (ppi > 0 && mpi > 0) {
                        cpiVal = (ppi + mpi) / 2.0;
                    } else if (ppi > 0) {
                        cpiVal = ppi;
                    } else if (mpi > 0) {
                        cpiVal = mpi;
                    }
                    return DashboardStatsResponse.PlayerPerformanceDto.builder()
                            .name(p.getName())
                            .cpi(cpiVal)
                            .role(p.getRole() != null ? p.getRole() : "Player")
                            .build();
                })
                .collect(Collectors.toList());

        List<DashboardStatsResponse.PlayerPerformanceDto> playersNeedingAttention = new ArrayList<>(playerPerformances);
        playersNeedingAttention.sort(Comparator.comparingDouble(DashboardStatsResponse.PlayerPerformanceDto::getCpi));
        if (playersNeedingAttention.size() > 5) {
            playersNeedingAttention = playersNeedingAttention.subList(0, 5);
        }

        List<DashboardStatsResponse.PlayerPerformanceDto> topPerformers = playerPerformances.stream()
                .filter(p -> p.getCpi() > 0)
                .sorted((a, b) -> Double.compare(b.getCpi(), a.getCpi()))
                .collect(Collectors.toList());
        if (topPerformers.size() > 5) {
            topPerformers = topPerformers.subList(0, 5);
        }

        // Coach Insights generator
        List<String> coachInsights = new ArrayList<>();
        if (avgCpi > 0) {
            if (avgPpi > avgMpi + 0.5) {
                coachInsights.add("Practice consistency is strong, but match execution under pressure needs focus.");
                coachInsights.add("Simulate match pressures (run-chase targets, wicket constraints) during net sessions.");
            } else if (avgMpi > avgPpi + 0.5) {
                coachInsights.add("Match execution is high. Maintain discipline during structured practice drills.");
                coachInsights.add("Log practice session intentions to align nets with match scenarios.");
            } else {
                coachInsights.add("Overall skills are well-balanced between practice and match assessments.");
                coachInsights.add("Keep up current training routines; focus on tactical field placement awareness.");
            }
        } else {
            coachInsights.add("No assessment data logged yet. Complete a Practice or Match Assessment to generate insights.");
        }

        if (practicesToday > 0) {
            coachInsights.add("Completed " + practicesToday + " practice assessments today. Nice consistency!");
        }
        if (matchesToday > 0) {
            coachInsights.add("Analyzed " + matchesToday + " match assessments today. Good work reviewing match play!");
        }
        if (playersNeedingAttention.stream().anyMatch(p -> p.getCpi() == 0)) {
            coachInsights.add("Some players have not been assessed yet. Prioritize logging their initial scores.");
        }

        if (coachInsights.size() > 4) {
            coachInsights = coachInsights.subList(0, 4);
        }

        DashboardStatsResponse response = DashboardStatsResponse.builder()
                .totalTeams(0L)
                .totalPlayers(totalPlayers)
                .totalPracticeSessions(totalPracticeSessions)
                .totalMatches(totalMatches)
                .avgPpi(avgPpi)
                .avgMpi(avgMpi)
                .avgCpi(avgCpi)
                .playersAssessedToday(playersAssessedToday)
                .practicesToday(practicesToday)
                .matchesToday(matchesToday)
                .recentAssessments(recentAssessments)
                .playersNeedingAttention(playersNeedingAttention)
                .topPerformers(topPerformers)
                .coachInsights(coachInsights)
                .teamPerformance(List.of())
                .cpiTrend(cpiTrend)
                .practiceTrend(practiceTrend)
                .matchTrend(matchTrend)
                .activityFeed(sortedActivities)
                .build();

        return ResponseEntity.ok(response);
    }
}
