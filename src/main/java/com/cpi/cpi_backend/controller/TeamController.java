package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PlayerResponse;
import com.cpi.cpi_backend.dto.TeamNoteRequest;
import com.cpi.cpi_backend.dto.TeamNoteResponse;
import com.cpi.cpi_backend.dto.TeamRequest;
import com.cpi.cpi_backend.dto.TeamResponse;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.MatchAssessment;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.PracticeAssessment;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.entity.TeamNote;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.MatchAssessmentRepository;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.PracticeAssessmentRepository;
import com.cpi.cpi_backend.repository.TeamNoteRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import com.cpi.cpi_backend.config.CacheNames;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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
    private final TeamNoteRepository teamNoteRepository;

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

    private List<TeamResponse> toTeamResponseList(List<Team> teams) {
        if (teams == null || teams.isEmpty()) return Collections.emptyList();

        Set<Long> allPlayerIds = new HashSet<>();
        for (Team t : teams) {
            if (t.getPlayers() != null) {
                for (Player p : t.getPlayers()) {
                    if (p != null && p.getId() != null) {
                        allPlayerIds.add(p.getId());
                    }
                }
            }
        }

        Map<Long, String> practiceDateMap = new HashMap<>();
        Map<Long, String> matchDateMap = new HashMap<>();

        if (!allPlayerIds.isEmpty()) {
            List<Object[]> pracList = practiceAssessmentRepository.findMaxDatesByPlayerIds(new ArrayList<>(allPlayerIds));
            for (Object[] row : pracList) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    practiceDateMap.put((Long) row[0], row[1].toString());
                }
            }
            List<Object[]> matchList = matchAssessmentRepository.findMaxDatesByPlayerIds(new ArrayList<>(allPlayerIds));
            for (Object[] row : matchList) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    matchDateMap.put((Long) row[0], row[1].toString());
                }
            }
        }

        List<TeamResponse> responseList = new ArrayList<>();
        for (Team team : teams) {
            if (team == null) continue;
            List<Player> players = team.getPlayers() != null ? team.getPlayers() : Collections.emptyList();
            List<PlayerResponse> playerResponses = players.stream()
                    .map(p -> toPlayerResponse(p, practiceDateMap, matchDateMap))
                    .collect(Collectors.toList());

            responseList.add(TeamResponse.builder()
                    .id(team.getId())
                    .name(team.getName())
                    .description(team.getDescription())
                    .coachId(team.getCoach() != null ? team.getCoach().getId() : null)
                    .players(playerResponses)
                    .createdAt(team.getCreatedAt())
                    .build());
        }
        return responseList;
    }

    private TeamResponse toTeamResponse(Team team) {
        if (team == null) return null;
        List<TeamResponse> list = toTeamResponseList(Collections.singletonList(team));
        return list.isEmpty() ? null : list.get(0);
    }

    private TeamNoteResponse toTeamNoteResponse(TeamNote note) {
        if (note == null) return null;
        return TeamNoteResponse.builder()
                .id(note.getId())
                .teamId(note.getTeam() != null ? note.getTeam().getId() : null)
                .coachName(note.getCoach() != null ? note.getCoach().getName() : "Coach")
                .type(note.getType())
                .date(note.getDate())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .build();
    }

    @GetMapping
    @Transactional
    @Cacheable(value = CacheNames.TEAMS, key = "'coach:' + #currentCoach.id")
    public ResponseEntity<List<TeamResponse>> getMyTeams(@AuthenticationPrincipal Coach currentCoach) {
        Coach coach = getManagedCoach(currentCoach);
        List<Team> teams = new ArrayList<>(teamRepository.findByCoachId(coach.getId()));
        String queryMethod = "teamRepository.findByCoachId(" + coach.getId() + ")";

        // Auto-initialize primary team if coach has players or existing system data but zero teams linked
        if (teams.isEmpty()) {
            List<Player> coachPlayers = playerRepository.findByCreatorCoachId(coach.getId());
            if (coachPlayers.isEmpty() && playerRepository.count() > 0) {
                coachPlayers = playerRepository.findAll();
            }
            if (!coachPlayers.isEmpty()) {
                Team defaultTeam = Team.builder()
                        .name("Main Team")
                        .description("Primary Squad Team")
                        .coach(coach)
                        .players(new ArrayList<>(coachPlayers))
                        .build();
                Team saved = teamRepository.save(defaultTeam);
                teams = List.of(saved);
                queryMethod = "teamRepository.save(Main Team) [Primary Team Auto-Link]";
            } else if (teamRepository.count() > 0) {
                teams = new ArrayList<>(teamRepository.findAll());
                queryMethod = "teamRepository.findAll() [System Fallback]";
            }
        }

        List<TeamResponse> response = toTeamResponseList(teams);

        System.out.println(String.format(
            "[DIAGNOSTIC LOG] Endpoint: GET /api/teams | User Email: %s | Coach ID: %d | Query: %s | Teams Returned: %d",
            coach.getEmail(), coach.getId(), queryMethod, response.size()
        ));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-team")
    @Transactional
    public ResponseEntity<TeamResponse> getMyPrimaryTeam(@AuthenticationPrincipal Coach currentCoach) {
        Coach coach = getManagedCoach(currentCoach);
        List<TeamResponse> allTeams = getMyTeams(currentCoach).getBody();
        TeamResponse primary = (allTeams != null && !allTeams.isEmpty()) ? allTeams.get(0) : null;

        System.out.println(String.format(
            "[DIAGNOSTIC LOG] Endpoint: GET /api/teams/my-team | User Email: %s | Coach ID: %d | Primary Team ID: %s",
            coach.getEmail(), coach.getId(), primary != null ? primary.getId() : "null"
        ));

        return ResponseEntity.ok(primary);
    }

    @PostMapping
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheNames.TEAMS, key = "'coach:' + #currentCoach.id"),
        @CacheEvict(value = CacheNames.DASHBOARD_STATS, key = "'coach:' + #currentCoach.id")
    })
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
    @Caching(evict = {
        @CacheEvict(value = CacheNames.TEAMS, key = "'coach:' + #currentCoach.id"),
        @CacheEvict(value = CacheNames.DASHBOARD_STATS, key = "'coach:' + #currentCoach.id")
    })
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
    @Caching(evict = {
        @CacheEvict(value = CacheNames.TEAMS, key = "'coach:' + #currentCoach.id"),
        @CacheEvict(value = CacheNames.DASHBOARD_STATS, key = "'coach:' + #currentCoach.id")
    })
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
    @Caching(evict = {
        @CacheEvict(value = CacheNames.TEAMS, key = "'coach:' + #currentCoach.id"),
        @CacheEvict(value = CacheNames.DASHBOARD_STATS, key = "'coach:' + #currentCoach.id")
    })
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
    @Caching(evict = {
        @CacheEvict(value = CacheNames.TEAMS, key = "'coach:' + #currentCoach.id"),
        @CacheEvict(value = CacheNames.DASHBOARD_STATS, key = "'coach:' + #currentCoach.id")
    })
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

    // ==========================================
    // TEAM ASSESSMENTS & TEAM COACH NOTES ENDPOINTS
    // ==========================================

    @GetMapping("/{id}/assessments")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getTeamAssessments(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getManagedCoach(currentCoach);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (team.getCoach() == null || !team.getCoach().getId().equals(coach.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to access this team's assessments");
        }

        List<Player> squad = team.getPlayers() != null ? team.getPlayers() : Collections.emptyList();
        List<Long> playerIds = squad.stream().map(Player::getId).collect(Collectors.toList());

        List<PracticeAssessment> practiceAssessments = new ArrayList<>();
        List<MatchAssessment> matchAssessments = new ArrayList<>();

        if (!playerIds.isEmpty()) {
            for (Long pid : playerIds) {
                practiceAssessments.addAll(practiceAssessmentRepository.findByPlayerId(pid));
                matchAssessments.addAll(matchAssessmentRepository.findByPlayerId(pid));
            }
        }

        // Sort assessments descending by date
        practiceAssessments.sort(Comparator.comparing(PracticeAssessment::getDate, Comparator.nullsLast(Comparator.reverseOrder())));
        matchAssessments.sort(Comparator.comparing(MatchAssessment::getDate, Comparator.nullsLast(Comparator.reverseOrder())));

        Map<String, Object> response = new HashMap<>();
        response.put("practiceAssessments", practiceAssessments);
        response.put("matchAssessments", matchAssessments);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/notes")
    @Transactional(readOnly = true)
    public ResponseEntity<List<TeamNoteResponse>> getTeamNotes(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getManagedCoach(currentCoach);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (team.getCoach() == null || !team.getCoach().getId().equals(coach.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to view notes for this team");
        }

        List<TeamNote> notes = teamNoteRepository.findByTeamIdOrderByDateDescCreatedAtDesc(team.getId());
        List<TeamNoteResponse> response = notes.stream().map(this::toTeamNoteResponse).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/notes")
    @Transactional
    public ResponseEntity<TeamNoteResponse> createTeamNote(
            @PathVariable Long id,
            @RequestBody TeamNoteRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getManagedCoach(currentCoach);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (team.getCoach() == null || !team.getCoach().getId().equals(coach.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to add notes for this team");
        }

        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note content cannot be empty");
        }

        String type = (request.getType() != null && request.getType().equalsIgnoreCase("MATCH")) ? "MATCH" : "PRACTICE";
        java.time.LocalDate date = request.getDate() != null ? request.getDate() : java.time.LocalDate.now();

        TeamNote note = TeamNote.builder()
                .team(team)
                .coach(coach)
                .type(type)
                .date(date)
                .content(request.getContent().trim())
                .build();

        TeamNote saved = teamNoteRepository.save(note);
        return ResponseEntity.ok(toTeamNoteResponse(saved));
    }

    @DeleteMapping("/{id}/notes/{noteId}")
    @Transactional
    public ResponseEntity<Void> deleteTeamNote(
            @PathVariable Long id,
            @PathVariable Long noteId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getManagedCoach(currentCoach);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (team.getCoach() == null || !team.getCoach().getId().equals(coach.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to modify notes for this team");
        }

        TeamNote note = teamNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team note not found"));

        if (!note.getTeam().getId().equals(team.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note does not belong to this team");
        }

        teamNoteRepository.delete(note);
        return ResponseEntity.noContent().build();
    }
}
