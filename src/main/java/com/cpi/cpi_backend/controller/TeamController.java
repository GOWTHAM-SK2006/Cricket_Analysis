package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PlayerResponse;
import com.cpi.cpi_backend.dto.TeamRequest;
import com.cpi.cpi_backend.dto.TeamResponse;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.MatchAssessmentRepository;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.PracticeAssessmentRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final CoachRepository coachRepository;
    private final PlayerRepository playerRepository;
    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final MatchAssessmentRepository matchAssessmentRepository;

    private Coach getManagedCoach(Coach currentCoach) {
        if (currentCoach == null || currentCoach.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coach not found"));
    }

    private PlayerResponse toPlayerResponse(Player player, Map<Long, String> practiceDateMap, Map<Long, String> matchDateMap) {
        if (player == null) return null;

        PlayerResponse.CoachSummary coachSummary = null;
        if (player.getCreatorCoach() != null) {
            coachSummary = PlayerResponse.CoachSummary.builder()
                    .id(player.getCreatorCoach().getId())
                    .name(player.getCreatorCoach().getName())
                    .email(player.getCreatorCoach().getEmail())
                    .build();
        }

        return PlayerResponse.builder()
                .id(player.getId())
                .name(player.getName())
                .role(player.getRole())
                .battingStyle(player.getBattingStyle())
                .bowlingStyle(player.getBowlingStyle())
                .imageUrl(player.getImageUrl())
                .ppiScore(player.getPpiScore())
                .mpiScore(player.getMpiScore())
                .invitationCode(player.getInvitationCode())
                .invitationCodeActivated(player.getInvitationCodeActivated())
                .creatorCoach(coachSummary)
                .createdAt(player.getCreatedAt())
                .lastPracticeDate(practiceDateMap != null ? practiceDateMap.get(player.getId()) : null)
                .lastMatchDate(matchDateMap != null ? matchDateMap.get(player.getId()) : null)
                .build();
    }

    private TeamResponse toTeamResponse(Team team) {
        if (team == null) return null;

        List<Player> players = team.getPlayers() != null ? team.getPlayers() : Collections.emptyList();
        List<Long> playerIds = players.stream().map(Player::getId).collect(Collectors.toList());

        Map<Long, String> practiceDateMap = new HashMap<>();
        Map<Long, String> matchDateMap = new HashMap<>();

        if (!playerIds.isEmpty()) {
            List<Object[]> pracList = practiceAssessmentRepository.findMaxDatesByPlayerIds(playerIds);
            for (Object[] row : pracList) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    practiceDateMap.put((Long) row[0], row[1].toString());
                }
            }
            List<Object[]> matchList = matchAssessmentRepository.findMaxDatesByPlayerIds(playerIds);
            for (Object[] row : matchList) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    matchDateMap.put((Long) row[0], row[1].toString());
                }
            }
        }

        List<PlayerResponse> playerResponses = players.stream()
                .map(p -> toPlayerResponse(p, practiceDateMap, matchDateMap))
                .collect(Collectors.toList());

        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .coachId(team.getCoach() != null ? team.getCoach().getId() : null)
                .players(playerResponses)
                .createdAt(team.getCreatedAt())
                .build();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<TeamResponse>> getMyTeams(@AuthenticationPrincipal Coach currentCoach) {
        Coach coach = getManagedCoach(currentCoach);
        List<Team> teams = teamRepository.findByCoachId(coach.getId());
        List<TeamResponse> response = teams.stream().map(this::toTeamResponse).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-team")
    @Transactional(readOnly = true)
    public ResponseEntity<TeamResponse> getMyPrimaryTeam(@AuthenticationPrincipal Coach currentCoach) {
        Coach coach = getManagedCoach(currentCoach);
        Optional<Team> teamOpt = teamRepository.findFirstByCoachIdOrderByIdAsc(coach.getId());
        return teamOpt.map(team -> ResponseEntity.ok(toTeamResponse(team)))
                .orElseGet(() -> ResponseEntity.ok(null));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<TeamResponse> createTeam(
            @RequestBody TeamRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getManagedCoach(currentCoach);

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team name is required");
        }

        List<Player> initialPlayers = new ArrayList<>();
        if (request.getPlayerIds() != null && !request.getPlayerIds().isEmpty()) {
            List<Player> coachPlayers = playerRepository.findByCreatorCoachId(coach.getId());
            Set<Long> coachPlayerIds = coachPlayers.stream().map(Player::getId).collect(Collectors.toSet());

            for (Long pid : request.getPlayerIds()) {
                if (coachPlayerIds.contains(pid)) {
                    playerRepository.findById(pid).ifPresent(initialPlayers::add);
                }
            }
        }

        Team team = Team.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .coach(coach)
                .players(initialPlayers)
                .build();

        Team saved = teamRepository.save(team);
        return ResponseEntity.ok(toTeamResponse(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable Long id,
            @RequestBody TeamRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getManagedCoach(currentCoach);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (team.getCoach() == null || !team.getCoach().getId().equals(coach.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to update this team");
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            team.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            team.setDescription(request.getDescription().trim());
        }

        if (request.getPlayerIds() != null) {
            List<Player> coachPlayers = playerRepository.findByCreatorCoachId(coach.getId());
            Set<Long> coachPlayerIds = coachPlayers.stream().map(Player::getId).collect(Collectors.toSet());
            
            List<Player> updatedPlayers = new ArrayList<>();
            for (Long pid : request.getPlayerIds()) {
                if (coachPlayerIds.contains(pid)) {
                    playerRepository.findById(pid).ifPresent(updatedPlayers::add);
                }
            }
            team.setPlayers(updatedPlayers);
        }

        Team saved = teamRepository.save(team);
        return ResponseEntity.ok(toTeamResponse(saved));
    }

    @PostMapping("/{id}/players")
    @Transactional
    public ResponseEntity<TeamResponse> addPlayersToTeam(
            @PathVariable Long id,
            @RequestBody TeamRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getManagedCoach(currentCoach);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (team.getCoach() == null || !team.getCoach().getId().equals(coach.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to modify this team");
        }

        if (request.getPlayerIds() != null && !request.getPlayerIds().isEmpty()) {
            List<Player> coachPlayers = playerRepository.findByCreatorCoachId(coach.getId());
            Set<Long> coachPlayerIds = coachPlayers.stream().map(Player::getId).collect(Collectors.toSet());

            List<Player> currentSquad = new ArrayList<>(team.getPlayers());
            Set<Long> existingSquadIds = currentSquad.stream().map(Player::getId).collect(Collectors.toSet());

            for (Long pid : request.getPlayerIds()) {
                if (coachPlayerIds.contains(pid) && !existingSquadIds.contains(pid)) {
                    playerRepository.findById(pid).ifPresent(p -> {
                        currentSquad.add(p);
                        existingSquadIds.add(p.getId());
                    });
                }
            }
            team.setPlayers(currentSquad);
        }

        Team saved = teamRepository.save(team);
        return ResponseEntity.ok(toTeamResponse(saved));
    }

    @DeleteMapping("/{id}/players/{playerId}")
    @Transactional
    public ResponseEntity<TeamResponse> removePlayerFromTeam(
            @PathVariable Long id,
            @PathVariable Long playerId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getManagedCoach(currentCoach);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (team.getCoach() == null || !team.getCoach().getId().equals(coach.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to modify this team");
        }

        List<Player> updatedSquad = team.getPlayers().stream()
                .filter(p -> p.getId() != null && !p.getId().equals(playerId))
                .collect(Collectors.toList());

        team.setPlayers(updatedSquad);
        Team saved = teamRepository.save(team);
        return ResponseEntity.ok(toTeamResponse(saved));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getManagedCoach(currentCoach);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (team.getCoach() == null || !team.getCoach().getId().equals(coach.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to delete this team");
        }

        teamRepository.delete(team);
        return ResponseEntity.noContent().build();
    }
}
