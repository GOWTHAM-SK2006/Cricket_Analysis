package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.PracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeSessionRepository extends JpaRepository<PracticeSession, Long> {
    
    @Query("SELECT ps FROM PracticeSession ps WHERE ps.team.coach.id = :coachId ORDER BY ps.date DESC, ps.id DESC")
    List<PracticeSession> findByCoachId(@Param("coachId") Long coachId);

    @Query("SELECT ps FROM PracticeSession ps WHERE ps.team.organization.id = :orgId ORDER BY ps.date DESC, ps.id DESC")
    List<PracticeSession> findByOrganizationId(@Param("orgId") Long orgId);
}
