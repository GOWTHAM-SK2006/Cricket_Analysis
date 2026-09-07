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
public class TeamResponse {
    private Long id;
    private String name;
    private String description;
    private Long coachId;
    private List<PlayerResponse> players;
    private LocalDateTime createdAt;
}
