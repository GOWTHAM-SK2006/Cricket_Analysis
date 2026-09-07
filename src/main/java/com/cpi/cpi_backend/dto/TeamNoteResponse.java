package com.cpi.cpi_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TeamNoteResponse {
    private Long id;
    private Long teamId;
    private String coachName;
    private String type;
    private LocalDate date;
    private String content;
    private LocalDateTime createdAt;
}
