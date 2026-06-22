package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.PracticeAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeAssessmentRepository extends JpaRepository<PracticeAssessment, Long> {
    List<PracticeAssessment> findByPlayerId(Long playerId);
    List<PracticeAssessment> findByCoachId(Long coachId);
}
