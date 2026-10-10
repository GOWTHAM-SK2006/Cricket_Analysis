package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.TeamNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface TeamNoteRepository extends JpaRepository<TeamNote, Long> {
    List<TeamNote> findByTeamIdOrderByDateDescCreatedAtDesc(Long teamId);
    
    @Query("SELECT n FROM TeamNote n LEFT JOIN FETCH n.coach WHERE n.team.id = :teamId ORDER BY n.date DESC, n.createdAt DESC")
    List<TeamNote> findByTeamIdWithCoachOrderByDateDescCreatedAtDesc(@Param("teamId") Long teamId);

    List<TeamNote> findByTeamIdAndTypeOrderByDateDescCreatedAtDesc(Long teamId, String type);
}
