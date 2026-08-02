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
    private Integer technicalExecution;
    private Integer skillsLevel;
    private Integer intensity;
    private Integer concentration;
    private Integer decisionMaking;
    private Integer preparation;
    private Integer gameAwareness;
    private Integer adaptability;
    private Integer discipline;
    private Integer teamwork;
    private Integer coachability;
    private Integer workEthic;
    private Integer emotionalControl;
    private String notes;
}
