package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PracticeAssessmentRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.PracticeAssessment;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.PracticeAssessmentRepository;
import com.cpi.cpi_backend.repository.CoachRepository;
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
    private final CoachRepository coachRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<PracticeAssessment> saveAssessment(
            @RequestBody PracticeAssessmentRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Player not found."
                ));

        if (currentCoach == null || currentCoach.getId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Coach information is missing from authentication."
            );
        }
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Coach not found."
                ));

        boolean authorized = false;
        if (player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId())) {
            authorized = true;
        } else if (player.getName() != null && player.getName().equalsIgnoreCase(managedCoach.getName())) {
            authorized = true;
        }

        if (!authorized) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "You are not authorized to assess this player."
            );
        }

        // Calculate PPI across all non-null parameters
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
        double ppi = count > 0 ? (sum / count) : 0.0;

        java.time.LocalDate assessmentDate = request.getDate() != null ? request.getDate() : java.time.LocalDate.now();

        PracticeAssessment assessment = PracticeAssessment.builder()
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

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<PracticeAssessment>> getPlayerAssessments(
            @PathVariable Long playerId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        boolean authorized = (player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId())) ||
                (player.getName() != null && player.getName().equalsIgnoreCase(managedCoach.getName()));
        if (!authorized) {
            throw new RuntimeException("Unauthorized");
        }

        return ResponseEntity.ok(practiceAssessmentRepository.findByPlayerId(playerId));
    }
}
