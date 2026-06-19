package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByCoachId(Long coachId);
    List<Team> findByOrganizationId(Long organizationId);
}
