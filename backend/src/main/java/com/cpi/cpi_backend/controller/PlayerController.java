package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PlayerRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;

    @GetMapping
    public ResponseEntity<List<Player>> getMyPlayers(@AuthenticationPrincipal Coach currentCoach) {
        return ResponseEntity.ok(playerRepository.findByTeamCoachId(currentCoach.getId()));
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<Player>> getTeamPlayers(
            @PathVariable Long teamId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        // ideally add a check to make sure teamId belongs to currentCoach
        return ResponseEntity.ok(playerRepository.findByTeamId(teamId));
    }

    @PostMapping
    public ResponseEntity<Player> createPlayer(
            @RequestBody PlayerRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
                
        // Ensure coach owns this team
        if (!team.getCoach().getId().equals(currentCoach.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        Player player = Player.builder()
                .name(request.getName())
                .role(request.getRole())
                .battingStyle(request.getBattingStyle())
                .bowlingStyle(request.getBowlingStyle())
                .team(team)
                .ppiScore(0.0)
                .mpiScore(0.0)
                .build();
                
        return ResponseEntity.ok(playerRepository.save(player));
    }
}
