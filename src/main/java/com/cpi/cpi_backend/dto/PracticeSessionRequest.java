package com.cpi.cpi_backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class PracticeSessionRequest {
    private Long teamId;
    private LocalDate date;
    private String name;
    private List<AssessmentDto> assessments;

    @Data
    public static class AssessmentDto {
        private Long playerId;
        private Integer technique;
        private Integer intensity;
        private Integer execution;
        private Integer adaptability;
        private Integer discipline;
        private Integer focus;
        private String notes;
    }
}
