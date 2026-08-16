package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PlayerRequest;
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

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerRepository playerRepository;
    private final CoachRepository coachRepository;
    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final MatchAssessmentRepository matchAssessmentRepository;

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
    public ResponseEntity<List<Player>> getMyPlayers(@AuthenticationPrincipal Coach currentCoach) {
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

        return ResponseEntity.ok(allPlayers);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Player> getPlayerById(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Player not found"
                ));

        checkAccess(player, currentCoach);

        return ResponseEntity.ok(player);
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
    public ResponseEntity<Player> createPlayer(
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
                .creatorCoach(creatorCoach)
                .ppiScore(0.0)
                .mpiScore(0.0)
                .invitationCode(code)
                .invitationCodeActivated(false)
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

        checkAccess(player, currentCoach);

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

        checkAccess(player, currentCoach);

        practiceAssessmentRepository.deleteAll(practiceAssessmentRepository.findByPlayerId(player.getId()));
        matchAssessmentRepository.deleteAll(matchAssessmentRepository.findByPlayerId(player.getId()));

        playerRepository.delete(player);
        return ResponseEntity.noContent().build();
    }
}
