package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PlayerRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import com.cpi.cpi_backend.repository.CoachRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final CoachRepository coachRepository;

    private void checkAccess(Team team, Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getRole() == Role.ADMIN) {
            // Admin can access any team in their organization
            if (team.getOrganization() == null || managedCoach.getOrganization() == null ||
                !team.getOrganization().getId().equals(managedCoach.getOrganization().getId())) {
                throw new RuntimeException("Unauthorized: Team belongs to a different organization");
            }
        } else {
            // Normal coach can only access their own teams
            if (!team.getCoach().getId().equals(managedCoach.getId())) {
                throw new RuntimeException("Unauthorized: You do not manage this team");
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<Player>> getMyPlayers(@AuthenticationPrincipal Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null) {
            return ResponseEntity.ok(List.of());
        }

        if (managedCoach.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(playerRepository.findByOrganizationId(managedCoach.getOrganization().getId()));
        } else {
            return ResponseEntity.ok(playerRepository.findByTeamCoachId(managedCoach.getId()));
        }
    }

    @GetMapping("/team/{teamId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Player>> getTeamPlayers(
            @PathVariable Long teamId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        checkAccess(team, currentCoach);
        
        return ResponseEntity.ok(playerRepository.findByTeamId(teamId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Player> createPlayer(
            @RequestBody PlayerRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
                
        checkAccess(team, currentCoach);

        Player player = Player.builder()
                .name(request.getName())
                .role(request.getRole())
                .battingStyle(request.getBattingStyle())
                .bowlingStyle(request.getBowlingStyle())
                .team(team)
                .organization(team.getOrganization())
                .ppiScore(0.0)
                .mpiScore(0.0)
                .build();
                
        return ResponseEntity.ok(playerRepository.save(player));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Player> updatePlayer(
            @PathVariable Long id,
            @RequestBody PlayerRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        checkAccess(player.getTeam(), currentCoach);

        // Ensure coach has access to new team if teamId is changed
        if (!player.getTeam().getId().equals(request.getTeamId())) {
            Team newTeam = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new RuntimeException("New team not found"));
            checkAccess(newTeam, currentCoach);
            player.setTeam(newTeam);
        }

        player.setName(request.getName());
        player.setRole(request.getRole());
        player.setBattingStyle(request.getBattingStyle());
        player.setBowlingStyle(request.getBowlingStyle());

        return ResponseEntity.ok(playerRepository.save(player));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deletePlayer(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        checkAccess(player.getTeam(), currentCoach);

        playerRepository.delete(player);
        return ResponseEntity.noContent().build();
    }
}
