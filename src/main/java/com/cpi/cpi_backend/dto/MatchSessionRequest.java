package com.cpi.cpi_backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class MatchSessionRequest {
    private Long teamId;
    private LocalDate date;
    private String name;
    private String opponent;
    private String venue;
    private List<AssessmentDto> assessments;

    @Data
    public static class AssessmentDto {
        private Long playerId;
        private Integer technicalExecution;
        private Integer decisionMaking;
        private Integer gameAwareness;
        private Integer pressureHandling;
        private Integer teamContribution;
        private Integer matchImpact;
        private String notes;
    }
}
