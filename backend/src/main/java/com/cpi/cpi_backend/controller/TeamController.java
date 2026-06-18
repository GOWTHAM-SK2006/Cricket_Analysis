package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.TeamRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;

    @GetMapping
    public ResponseEntity<List<Team>> getMyTeams(@AuthenticationPrincipal Coach currentCoach) {
        return ResponseEntity.ok(teamRepository.findByCoachId(currentCoach.getId()));
    }

    @PostMapping
    public ResponseEntity<Team> createTeam(
            @RequestBody TeamRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = Team.builder()
                .name(request.getName())
                .level(request.getLevel())
                .coach(currentCoach)
                .teamCpiScore(0.0)
                .build();
        return ResponseEntity.ok(teamRepository.save(team));
    }
}
