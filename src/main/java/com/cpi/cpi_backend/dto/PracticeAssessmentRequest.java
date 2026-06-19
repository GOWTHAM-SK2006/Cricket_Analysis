package com.cpi.cpi_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PracticeAssessmentRequest {
    private Long playerId;
    private LocalDate date;
    private Integer technique;
    private Integer intensity;
    private Integer execution;
    private Integer adaptability;
    private Integer discipline;
    private Integer focus;
    private String notes;
}
