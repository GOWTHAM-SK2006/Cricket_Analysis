package com.cpi.cpi_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsResponse {
    private long totalTeams;
    private long totalPlayers;
    private long totalPracticeSessions;
    private long totalMatches;
    private double avgPpi;
    private double avgMpi;
    private double avgCpi;

    private List<TeamPerformanceDto> teamPerformance;
    private List<TrendDto> cpiTrend;
    private List<TrendDto> practiceTrend;
    private List<TrendDto> matchTrend;
    private List<ActivityDto> activityFeed;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TeamPerformanceDto {
        private String teamName;
        private double cpi;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TrendDto {
        private String label; // e.g., "Week 1", "June 19"
        private double value;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ActivityDto {
        private String type; // PLAYER_ADDED, TEAM_CREATED, PRACTICE_COMPLETED, MATCH_RECORDED
        private String title;
        private String description;
        private LocalDateTime timestamp;
    }
}
