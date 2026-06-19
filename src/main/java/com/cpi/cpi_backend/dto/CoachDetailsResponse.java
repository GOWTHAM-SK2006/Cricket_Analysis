package com.cpi.cpi_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CoachDetailsResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String approvalStatus;
    private int totalTeams;
    private int totalPlayers;
    
    private double averageCpi;
    private double averagePpi;
    private double averageMpi;
    
    private List<TeamDetail> teams;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TeamDetail {
        private Long id;
        private String name;
        private String level;
        private double teamCpiScore;
        private int playersCount;
    }
}
