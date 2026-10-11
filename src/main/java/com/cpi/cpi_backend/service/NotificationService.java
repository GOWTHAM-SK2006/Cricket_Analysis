package com.cpi.cpi_backend.service;

import com.cpi.cpi_backend.dto.NotificationResponse;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Notification;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CoachRepository coachRepository;

    @Value("${cpi.notification.score-change-threshold:2.0}")
    private double scoreChangeThreshold;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Coach currentCoach, Boolean unreadOnly) {
        if (currentCoach == null || currentCoach.getId() == null) {
            return Collections.emptyList();
        }

        List<Notification> list = Boolean.TRUE.equals(unreadOnly)
                ? notificationRepository.findByCoachIdAndIsReadFalseOrderByCreatedAtDesc(currentCoach.getId())
                : notificationRepository.findByCoachIdOrderByCreatedAtDesc(currentCoach.getId());

        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Coach currentCoach) {
        if (currentCoach == null || currentCoach.getId() == null) {
            return 0L;
        }
        return notificationRepository.countByCoachIdAndIsReadFalse(currentCoach.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(Coach currentCoach, Long notificationId) {
        if (currentCoach == null || currentCoach.getId() == null || notificationId == null) {
            return null;
        }

        Notification notification = notificationRepository.findByIdAndCoachId(notificationId, currentCoach.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Notification not found"
                ));

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification = notificationRepository.save(notification);
        }

        return toResponse(notification);
    }

    @Transactional
    public int markAllAsRead(Coach currentCoach) {
        if (currentCoach == null || currentCoach.getId() == null) {
            return 0;
        }
        return notificationRepository.markAllAsReadByCoachId(currentCoach.getId());
    }

    @Transactional
    public void deleteNotification(Coach currentCoach, Long notificationId) {
        if (currentCoach == null || currentCoach.getId() == null || notificationId == null) {
            return;
        }

        Notification notification = notificationRepository.findByIdAndCoachId(notificationId, currentCoach.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Notification not found"
                ));

        notificationRepository.delete(notification);
    }

    @Transactional
    public void clearAllNotifications(Coach currentCoach) {
        if (currentCoach == null || currentCoach.getId() == null) {
            return;
        }
        notificationRepository.deleteAllByCoachId(currentCoach.getId());
    }

    @Transactional
    public Notification createNotification(
            Coach coach,
            String type,
            String title,
            String message,
            String link,
            String entityType,
            Long entityId,
            String dedupKey
    ) {
        if (coach == null || coach.getId() == null) {
            log.warn("Cannot create notification without a valid coach");
            return null;
        }

        // Deduplication check
        if (dedupKey != null && !dedupKey.isBlank()) {
            if (notificationRepository.existsByCoachIdAndDedupKey(coach.getId(), dedupKey)) {
                log.debug("Notification duplicate skipped for coach {} with dedupKey {}", coach.getId(), dedupKey);
                return null;
            }
        }

        Notification notification = Notification.builder()
                .coach(coach)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .entityType(entityType)
                .entityId(entityId)
                .isRead(false)
                .dedupKey(dedupKey)
                .build();

        return notificationRepository.save(notification);
    }

    /**
     * Notification Type 1: Practice / Match Assessment saved successfully.
     */
    @Transactional
    public void notifyAssessmentSaved(Coach coach, Player player, String assessmentType, Double score, Long assessmentId) {
        if (coach == null || player == null || assessmentId == null) return;

        String formattedScore = formatScoreDisplay(score);
        String typeLabel = assessmentType.equalsIgnoreCase("MATCH") ? "Match" : "Practice";
        String metricCode = assessmentType.equalsIgnoreCase("MATCH") ? "MPI" : "PPI";
        String title = typeLabel + " Assessment Recorded";
        String message = String.format("Successfully saved %s assessment for %s with %s score of %s.",
                typeLabel.toLowerCase(Locale.ROOT), player.getName(), metricCode, formattedScore);
        String link = "/history?playerId=" + player.getId();
        String dedupKey = "ASSESS_" + assessmentType.toUpperCase(Locale.ROOT) + "_" + assessmentId;

        createNotification(coach, "ASSESSMENT_SAVED", title, message, link,
                assessmentType.toUpperCase(Locale.ROOT) + "_ASSESSMENT", assessmentId, dedupKey);
    }

    /**
     * Notification Type 2: Significant CPI/PPI/MPI score change after a new assessment.
     */
    @Transactional
    public void checkAndNotifyScoreChange(
            Coach coach,
            Player player,
            String metricName,
            Double oldMetricScore,
            Double newMetricScore,
            Double oldCpi,
            Double newCpi,
            Long assessmentId
    ) {
        if (coach == null || player == null || assessmentId == null) return;

        // Only compare if an established baseline existed (old score > 0)
        if (oldMetricScore == null || oldMetricScore <= 0 || newMetricScore == null) {
            return;
        }

        double normOld = normalizeTo100(oldMetricScore);
        double normNew = normalizeTo100(newMetricScore);
        double diff = normNew - normOld;

        if (Math.abs(diff) >= scoreChangeThreshold) {
            String changeDirection = diff > 0 ? "increased" : "decreased";
            String diffSymbol = diff > 0 ? "+" : "";
            String message = String.format(
                    Locale.US,
                    "%s's %s %s from %.1f to %.1f (%s%.1f pts). Overall CPI is now %.1f.",
                    player.getName(),
                    metricName,
                    changeDirection,
                    normOld,
                    normNew,
                    diffSymbol,
                    diff,
                    normalizeTo100(newCpi != null ? newCpi : newMetricScore)
            );

            String title = diff > 0 ? "Significant Score Improvement" : "Significant Score Change Alert";
            String link = "/history?playerId=" + player.getId();
            String dedupKey = "SCORE_CHANGE_" + metricName + "_" + assessmentId;

            createNotification(coach, "SCORE_CHANGE", title, message, link, "PLAYER", player.getId(), dedupKey);
        }
    }

    /**
     * Notification Type 3: Player added, updated, or removed.
     */
    @Transactional
    public void notifyPlayerAction(Coach coach, Player player, String action) {
        if (coach == null || player == null) return;

        String title;
        String message;
        String dedupKey = null;

        switch (action.toUpperCase(Locale.ROOT)) {
            case "ADDED":
                title = "Player Added to Squad";
                message = String.format("%s was successfully registered to your squad roster.", player.getName());
                dedupKey = "PLAYER_ADDED_" + player.getId();
                break;
            case "UPDATED":
                title = "Player Profile Updated";
                message = String.format("Profile details for %s were updated successfully.", player.getName());
                break;
            case "REMOVED":
                title = "Player Removed";
                message = String.format("%s was removed from your squad.", player.getName());
                break;
            default:
                title = "Player Update";
                message = String.format("Update recorded for player %s.", player.getName());
        }

        createNotification(coach, "PLAYER_UPDATE", title, message, "/players", "PLAYER", player.getId(), dedupKey);
    }

    /**
     * Notification Type 4: Team-related updates.
     */
    @Transactional
    public void notifyTeamAction(Coach coach, Team team, String action, String customMessage) {
        if (coach == null || team == null) return;

        String title;
        String dedupKey = null;

        switch (action.toUpperCase(Locale.ROOT)) {
            case "CREATED":
                title = "Team Squad Created";
                dedupKey = "TEAM_CREATED_" + team.getId();
                break;
            case "UPDATED":
                title = "Team Information Updated";
                break;
            case "ROSTER_UPDATED":
                title = "Squad Roster Updated";
                break;
            case "DELETED":
                title = "Team Squad Removed";
                break;
            default:
                title = "Team Update";
        }

        createNotification(coach, "TEAM_UPDATE", title, customMessage, "/team", "TEAM", team.getId(), dedupKey);
    }

    /**
     * Notification Type 5: Premium subscription and renewal reminders.
     */
    @Transactional
    public void notifySubscriptionReminder(Coach coach, String title, String message, String dedupKey) {
        if (coach == null) return;
        createNotification(coach, "SUBSCRIPTION", title, message, "#premium", "SUBSCRIPTION", coach.getId(), dedupKey);
    }

    /**
     * Notification Type 6: Important CPI platform announcements.
     */
    @Transactional
    public int broadcastAnnouncement(String title, String message, String link, Long specificCoachId) {
        String targetLink = (link != null && !link.isBlank()) ? link : "/dashboard";
        int count = 0;

        if (specificCoachId != null) {
            Coach target = coachRepository.findById(specificCoachId).orElse(null);
            if (target != null) {
                createNotification(target, "ANNOUNCEMENT", title, message, targetLink, "ANNOUNCEMENT", null, null);
                count++;
            }
        } else {
            List<Coach> allCoaches = coachRepository.findAll();
            for (Coach c : allCoaches) {
                createNotification(c, "ANNOUNCEMENT", title, message, targetLink, "ANNOUNCEMENT", null, null);
                count++;
            }
        }
        return count;
    }

    private double normalizeTo100(Double score) {
        if (score == null || score <= 0) return 0.0;
        return score <= 10.0 ? score * 10.0 : score;
    }

    private String formatScoreDisplay(Double val) {
        if (val == null || val <= 0) return "0";
        double norm = normalizeTo100(val);
        return String.format(Locale.US, "%.1f", norm);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .link(n.getLink())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
