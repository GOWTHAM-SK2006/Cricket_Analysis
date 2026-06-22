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

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
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
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Long coachId = currentCoach.getId();
        Coach managedCoach = coachRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        List<Player> players;
        List<PracticeAssessment> practiceAssessments;
        List<MatchAssessment> matchAssessments;

        if (managedCoach.getRole() == Role.ADMIN) {
            players = playerRepository.findAll();
            practiceAssessments = practiceAssessmentRepository.findAll();
            matchAssessments = matchAssessmentRepository.findAll();
        } else {
            players = new ArrayList<>(playerRepository.findByCreatorCoachId(coachId));
            // Also check if there's a player record with their name (for self-assessments)
            boolean hasSelf = players.stream().anyMatch(p -> p.getName() != null && p.getName().equalsIgnoreCase(managedCoach.getName()));
            if (!hasSelf) {
                playerRepository.findAll().stream()
                        .filter(p -> p.getName() != null && p.getName().equalsIgnoreCase(managedCoach.getName()))
                        .findFirst()
                        .ifPresent(players::add);
            }
            practiceAssessments = practiceAssessmentRepository.findByCoachId(coachId);
            matchAssessments = matchAssessmentRepository.findByCoachId(coachId);
        }

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

        // Find all unique dates from practice and match assessments, sorted chronologically
        List<java.time.LocalDate> uniqueDates = new java.util.ArrayList<>();
        for (PracticeAssessment pa : practiceAssessments) {
            if (pa.getDate() != null && !uniqueDates.contains(pa.getDate())) {
                uniqueDates.add(pa.getDate());
            }
        }
        for (MatchAssessment ma : matchAssessments) {
            if (ma.getDate() != null && !uniqueDates.contains(ma.getDate())) {
                uniqueDates.add(ma.getDate());
            }
        }
        uniqueDates.sort(Comparator.naturalOrder());

        List<DashboardStatsResponse.TrendDto> practiceTrend = new ArrayList<>();
        List<DashboardStatsResponse.TrendDto> matchTrend = new ArrayList<>();
        List<DashboardStatsResponse.TrendDto> cpiTrend = new ArrayList<>();

        Double lastPpi = null;
        Double lastMpi = null;

        for (java.time.LocalDate date : uniqueDates) {
            String label = date.format(df);

            // Calculate average PPI on this date
            List<PracticeAssessment> pasOnDate = practiceAssessments.stream()
                    .filter(pa -> date.equals(pa.getDate()))
                    .collect(Collectors.toList());
            if (!pasOnDate.isEmpty()) {
                double avgP = pasOnDate.stream().mapToDouble(PracticeAssessment::getPpiScore).average().orElse(0.0);
                lastPpi = avgP;
            }

            // Calculate average MPI on this date
            List<MatchAssessment> masOnDate = matchAssessments.stream()
                    .filter(ma -> date.equals(ma.getDate()))
                    .collect(Collectors.toList());
            if (!masOnDate.isEmpty()) {
                double avgM = masOnDate.stream().mapToDouble(MatchAssessment::getMpiScore).average().orElse(0.0);
                lastMpi = avgM;
            }

            // Add PPI Trend
            practiceTrend.add(new DashboardStatsResponse.TrendDto(label, lastPpi != null ? lastPpi : 0.0));
            // Add MPI Trend
            matchTrend.add(new DashboardStatsResponse.TrendDto(label, lastMpi != null ? lastMpi : 0.0));

            // Calculate CPI Trend
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

        DashboardStatsResponse response = DashboardStatsResponse.builder()
                .totalTeams(0L)
                .totalPlayers(totalPlayers)
                .totalPracticeSessions(totalPracticeSessions)
                .totalMatches(totalMatches)
                .avgPpi(avgPpi)
                .avgMpi(avgMpi)
                .avgCpi(avgCpi)
                .teamPerformance(List.of())
                .cpiTrend(cpiTrend)
                .practiceTrend(practiceTrend)
                .matchTrend(matchTrend)
                .activityFeed(sortedActivities)
                .build();

        return ResponseEntity.ok(response);
    }
}
