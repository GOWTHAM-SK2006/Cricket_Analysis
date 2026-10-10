package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByCoachId(Long coachId);
    Optional<Team> findFirstByCoachIdOrderByIdAsc(Long coachId);

    @Query("SELECT DISTINCT t FROM Team t LEFT JOIN FETCH t.coach LEFT JOIN FETCH t.players p LEFT JOIN FETCH p.creatorCoach WHERE t.coach.id = :coachId ORDER BY t.id ASC")
    List<Team> findByCoachIdWithPlayersAndCoach(@Param("coachId") Long coachId);

    @Query("SELECT DISTINCT t FROM Team t LEFT JOIN FETCH t.coach LEFT JOIN FETCH t.players p LEFT JOIN FETCH p.creatorCoach WHERE t.id = :id")
    Optional<Team> findByIdWithPlayersAndCoach(@Param("id") Long id);
}
