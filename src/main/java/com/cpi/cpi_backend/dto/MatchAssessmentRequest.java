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
public class MatchAssessmentRequest {
    private Long playerId;
    private LocalDate date;
    private Integer technicalExecution;
    private Integer skillsLevel;
    private Integer gamePlan;
    private Integer preparation;
    private Integer intensity;
    private Integer focus;
    private Integer resilience;
    private Integer concentration;
    private Integer decisionMaking;
    private Integer gameAwareness;
    private Integer adaptability;
    private Integer discipline;
    private Integer teamwork;
    private Integer coachability;
    private Integer workEthic;
    private Integer emotionalControl;
    private String notes;
}
