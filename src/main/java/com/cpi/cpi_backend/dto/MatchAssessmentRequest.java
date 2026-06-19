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
    private Integer shotSelection;
    private Integer temperament;
    private Integer runningBetweenWickets;
    private Integer bowlingAccuracy;
    private Integer fieldingEffort;
    private Integer gameAwareness;
    private String notes;
}
