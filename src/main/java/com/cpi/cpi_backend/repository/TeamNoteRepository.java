package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.TeamNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamNoteRepository extends JpaRepository<TeamNote, Long> {
    List<TeamNote> findByTeamIdOrderByDateDescCreatedAtDesc(Long teamId);
    List<TeamNote> findByTeamIdAndTypeOrderByDateDescCreatedAtDesc(Long teamId, String type);
}
