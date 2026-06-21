package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.MatchSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchSessionRepository extends JpaRepository<MatchSession, Long> {
    
    @Query("SELECT ms FROM MatchSession ms WHERE ms.team.coach.id = :coachId ORDER BY ms.date DESC, ms.id DESC")
    List<MatchSession> findByCoachId(@Param("coachId") Long coachId);

    @Query("SELECT ms FROM MatchSession ms WHERE ms.team.organization.id = :orgId ORDER BY ms.date DESC, ms.id DESC")
    List<MatchSession> findByOrganizationId(@Param("orgId") Long orgId);
}
