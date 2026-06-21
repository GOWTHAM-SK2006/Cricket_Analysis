package com.cpi.cpi_backend.dto;

import com.cpi.cpi_backend.entity.MatchAssessment;
import com.cpi.cpi_backend.entity.MatchSession;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MatchSessionDetailsResponse {
    private MatchSession session;
    private List<MatchAssessment> assessments;
}
