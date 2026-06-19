package com.cpi.cpi_backend.dto;

import com.cpi.cpi_backend.entity.PracticeAssessment;
import com.cpi.cpi_backend.entity.PracticeSession;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PracticeSessionDetailsResponse {
    private PracticeSession session;
    private List<PracticeAssessment> assessments;
}
