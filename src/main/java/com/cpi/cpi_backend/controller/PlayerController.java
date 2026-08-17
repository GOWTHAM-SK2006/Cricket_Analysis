package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PlayerRequest;
import com.cpi.cpi_backend.dto.PlayerResponse;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.PracticeAssessmentRepository;
import com.cpi.cpi_backend.repository.MatchAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerRepository playerRepository;
    private final CoachRepository coachRepository;
    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final MatchAssessmentRepository matchAssessmentRepository;

    private PlayerResponse toPlayerResponse(Player player) {
        return toPlayerResponse(player, null, null);
    }

    private PlayerResponse toPlayerResponse(Player player, String lastPracticeDate, String lastMatchDate) {
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
                .lastPracticeDate(lastPracticeDate)
                .lastMatchDate(lastMatchDate)
                .build();
    }

    private void checkAccess(Player player, Coach currentCoach) {
        if (currentCoach == null || currentCoach.getId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Unauthorized"
            );
        }
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Coach not found"
                ));

        boolean isCreator = player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId());
        
        if (!isCreator) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "You are not authorized to access or modify this player."
            );
        }
    }

    @GetMapping
    @Transactional
    public ResponseEntity<List<PlayerResponse>> getMyPlayers(@AuthenticationPrincipal Coach currentCoach) {
        if (currentCoach == null || currentCoach.getId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Unauthorized"
            );
        }
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Coach not found"
                ));

        List<Player> allPlayers = new ArrayList<>(playerRepository.findByCreatorCoachId(managedCoach.getId()));

        // Generate invitation codes for any players missing one
        for (Player p : allPlayers) {
            if (p.getInvitationCode() == null || p.getInvitationCode().trim().isEmpty()) {
                String code;
                do {
                    code = generateInvitationCode();
                } while (playerRepository.findByInvitationCode(code).isPresent());
                p.setInvitationCode(code);
                p.setInvitationCodeActivated(false);
                playerRepository.save(p);
            }
        }

        List<Long> playerIds = allPlayers.stream().map(Player::getId).collect(Collectors.toList());
        java.util.Map<Long, String> practiceDateMap = new java.util.HashMap<>();
        java.util.Map<Long, String> matchDateMap = new java.util.HashMap<>();

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

        List<PlayerResponse> responseList = allPlayers.stream()
                .map(p -> toPlayerResponse(p, practiceDateMap.get(p.getId()), matchDateMap.get(p.getId())))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<PlayerResponse> getPlayerById(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Player not found"
                ));

        checkAccess(player, currentCoach);

        return ResponseEntity.ok(toPlayerResponse(player));
    }

    private String generateInvitationCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        java.util.Random rnd = new java.util.Random();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return "CPI-" + sb.toString();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<PlayerResponse> createPlayer(
            @RequestBody PlayerRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach creatorCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        String code;
        do {
            code = generateInvitationCode();
        } while (playerRepository.findByInvitationCode(code).isPresent());

        Player player = Player.builder()
                .name(request.getName())
                .role(request.getRole())
                .battingStyle(request.getBattingStyle())
                .bowlingStyle(request.getBowlingStyle())
                .imageUrl(request.getImageUrl())
                .creatorCoach(creatorCoach)
                .ppiScore(0.0)
                .mpiScore(0.0)
                .invitationCode(code)
                .invitationCodeActivated(false)
                .build();
                
        Player saved = playerRepository.save(player);
        return ResponseEntity.ok(toPlayerResponse(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<PlayerResponse> updatePlayer(
            @PathVariable Long id,
            @RequestBody PlayerRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        checkAccess(player, currentCoach);

        if (request.getName() != null) player.setName(request.getName());
        if (request.getRole() != null) player.setRole(request.getRole());
        if (request.getBattingStyle() != null) player.setBattingStyle(request.getBattingStyle());
        if (request.getBowlingStyle() != null) player.setBowlingStyle(request.getBowlingStyle());
        if (request.getImageUrl() != null) player.setImageUrl(request.getImageUrl());

        Player saved = playerRepository.save(player);
        return ResponseEntity.ok(toPlayerResponse(saved));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deletePlayer(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        checkAccess(player, currentCoach);

        practiceAssessmentRepository.deleteAll(practiceAssessmentRepository.findByPlayerId(player.getId()));
        matchAssessmentRepository.deleteAll(matchAssessmentRepository.findByPlayerId(player.getId()));

        playerRepository.delete(player);
        return ResponseEntity.noContent().build();
    }
}
