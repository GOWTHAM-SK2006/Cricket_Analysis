package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.MatchAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchAssessmentRepository extends JpaRepository<MatchAssessment, Long> {
    List<MatchAssessment> findByPlayerId(Long playerId);
    List<MatchAssessment> findByCoachId(Long coachId);
}
