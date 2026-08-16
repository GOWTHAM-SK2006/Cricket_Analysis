package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.MatchAssessmentRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.MatchAssessment;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.MatchAssessmentRepository;
import com.cpi.cpi_backend.repository.CoachRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchAssessmentRepository matchAssessmentRepository;
    private final PlayerRepository playerRepository;
    private final CoachRepository coachRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<MatchAssessment> saveAssessment(
            @RequestBody MatchAssessmentRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        if (currentCoach == null || currentCoach.getId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Coach information is missing from authentication."
            );
        }

        Player player = playerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Player not found."
                ));

        // Verify authorization
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Coach not found."
                ));

        boolean authorized = player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId());

        if (!authorized) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "You are not authorized to assess this player."
            );
        }

        // Calculate MPI across all non-null parameters
        java.util.List<Integer> metrics = java.util.Arrays.asList(
                request.getTechnicalExecution(),
                request.getSkillsLevel(),
                request.getGamePlan(),
                request.getPreparation(),
                request.getIntensity(),
                request.getFocus() != null ? request.getFocus() : request.getConcentration(),
                request.getResilience(),
                request.getConcentration(),
                request.getDecisionMaking(),
                request.getGameAwareness(),
                request.getAdaptability(),
                request.getDiscipline(),
                request.getTeamwork(),
                request.getCoachability(),
                request.getWorkEthic(),
                request.getEmotionalControl()
        );
        double sum = 0;
        int count = 0;
        for (Integer val : metrics) {
            if (val != null) {
                sum += val;
                count++;
            }
        }
        double mpi = count > 0 ? (sum / count) : 0.0;

        java.time.LocalDate assessmentDate = request.getDate() != null ? request.getDate() : java.time.LocalDate.now();

        MatchAssessment assessment = MatchAssessment.builder()
                .player(player)
                .coach(managedCoach)
                .date(assessmentDate)
                .technicalExecution(request.getTechnicalExecution())
                .skillsLevel(request.getSkillsLevel())
                .gamePlan(request.getGamePlan())
                .preparation(request.getPreparation())
                .intensity(request.getIntensity())
                .focus(request.getFocus())
                .resilience(request.getResilience())
                .concentration(request.getConcentration() != null ? request.getConcentration() : request.getFocus())
                .decisionMaking(request.getDecisionMaking())
                .gameAwareness(request.getGameAwareness())
                .adaptability(request.getAdaptability())
                .discipline(request.getDiscipline())
                .teamwork(request.getTeamwork())
                .coachability(request.getCoachability())
                .workEthic(request.getWorkEthic())
                .emotionalControl(request.getEmotionalControl())
                .mpiScore(mpi)
                .notes(request.getNotes())
                .build();

        MatchAssessment saved = matchAssessmentRepository.save(assessment);

        // Recalculate Player average MPI
        List<MatchAssessment> playerAssessments = matchAssessmentRepository.findByPlayerId(player.getId());
        double avgMpi = playerAssessments.stream()
                .mapToDouble(MatchAssessment::getMpiScore)
                .average()
                .orElse(0.0);
        player.setMpiScore(avgMpi);
        playerRepository.save(player);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<MatchAssessment>> getPlayerAssessments(
            @PathVariable Long playerId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        if (currentCoach == null || currentCoach.getId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Unauthorized"
            );
        }

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Player not found."
                ));

        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Coach not found."
                ));

        boolean authorized = player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId());
        if (!authorized) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "You are not authorized to view assessments for this player."
            );
        }

        return ResponseEntity.ok(matchAssessmentRepository.findByPlayerId(playerId));
    }
}
