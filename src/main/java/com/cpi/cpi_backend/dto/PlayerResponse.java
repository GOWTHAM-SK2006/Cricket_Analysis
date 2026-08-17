package com.cpi.cpi_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PlayerResponse {
    private Long id;
    private String name;
    private String role;
    private String battingStyle;
    private String bowlingStyle;
    private String imageUrl;
    private Double ppiScore;
    private Double mpiScore;
    private String invitationCode;
    private Boolean invitationCodeActivated;
    private CoachSummary creatorCoach;
    private LocalDateTime createdAt;
    private String lastPracticeDate;
    private String lastMatchDate;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CoachSummary {
        private Long id;
        private String name;
        private String email;
    }
}
