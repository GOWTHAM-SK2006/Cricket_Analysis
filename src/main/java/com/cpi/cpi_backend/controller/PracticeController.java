package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PracticeAssessmentRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.PracticeAssessment;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.PracticeAssessmentRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<PracticeAssessment> saveAssessment(
            @RequestBody PracticeAssessmentRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new RuntimeException("Player not found"));

        // Verify authorization
        if (!player.getTeam().getCoach().getId().equals(currentCoach.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        // Calculate PPI
        double ppi = (request.getTechnique() + request.getIntensity() + request.getExecution() +
                request.getAdaptability() + request.getDiscipline() + request.getFocus()) / 6.0;

        PracticeAssessment assessment = PracticeAssessment.builder()
                .player(player)
                .date(request.getDate())
                .technique(request.getTechnique())
                .intensity(request.getIntensity())
                .execution(request.getExecution())
                .adaptability(request.getAdaptability())
                .discipline(request.getDiscipline())
                .focus(request.getFocus())
                .ppiScore(ppi)
                .notes(request.getNotes())
                .build();

        PracticeAssessment saved = practiceAssessmentRepository.save(assessment);

        // Recalculate Player average PPI
        List<PracticeAssessment> playerAssessments = practiceAssessmentRepository.findByPlayerId(player.getId());
        double avgPpi = playerAssessments.stream()
                .mapToDouble(PracticeAssessment::getPpiScore)
                .average()
                .orElse(0.0);
        player.setPpiScore(avgPpi);
        playerRepository.save(player);

        // Recalculate Team average CPI score
        Team team = player.getTeam();
        List<Player> teamPlayers = playerRepository.findByTeamId(team.getId());
        double teamCpi = teamPlayers.stream()
                .mapToDouble(p -> ((p.getPpiScore() != null ? p.getPpiScore() : 0.0) + (p.getMpiScore() != null ? p.getMpiScore() : 0.0)) / 2.0)
                .average()
                .orElse(0.0);
        team.setTeamCpiScore(teamCpi);
        teamRepository.save(team);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<PracticeAssessment>> getPlayerAssessments(
            @PathVariable Long playerId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        if (!player.getTeam().getCoach().getId().equals(currentCoach.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        return ResponseEntity.ok(practiceAssessmentRepository.findByPlayerId(playerId));
    }
}
