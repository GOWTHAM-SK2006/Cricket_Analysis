package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.AnnouncementRequest;
import com.cpi.cpi_backend.dto.NotificationResponse;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final CoachRepository coachRepository;

    private Coach getAuthenticatedCoach(Coach currentCoach) {
        if (currentCoach == null || currentCoach.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coach not found"));
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam(value = "unreadOnly", required = false) Boolean unreadOnly,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getAuthenticatedCoach(currentCoach);
        List<NotificationResponse> list = notificationService.getNotifications(coach, unreadOnly);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getAuthenticatedCoach(currentCoach);
        long count = notificationService.getUnreadCount(coach);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getAuthenticatedCoach(currentCoach);
        NotificationResponse updated = notificationService.markAsRead(coach, id);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getAuthenticatedCoach(currentCoach);
        int count = notificationService.markAllAsRead(coach);
        return ResponseEntity.ok(Map.of("updatedCount", count));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getAuthenticatedCoach(currentCoach);
        notificationService.deleteNotification(coach, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllNotifications(
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getAuthenticatedCoach(currentCoach);
        notificationService.clearAllNotifications(coach);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/subscription-reminder")
    public ResponseEntity<Map<String, Object>> sendSubscriptionReminder(
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getAuthenticatedCoach(currentCoach);
        String title = "CPI Premium Subscription Reminder";
        String message = "Elevate your coaching with CPI Pro: Unlock unlimited player performance assessments, AI trend analysis, and comprehensive squad exports.";
        String dedupKey = "SUB_REMINDER_" + coach.getId() + "_" + java.time.LocalDate.now();
        notificationService.notifySubscriptionReminder(coach, title, message, dedupKey);
        return ResponseEntity.ok(Map.of("status", "Reminder sent", "success", true));
    }

    @PostMapping("/announcement")
    public ResponseEntity<Map<String, Object>> postAnnouncement(
            @RequestBody AnnouncementRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach coach = getAuthenticatedCoach(currentCoach);
        if (request.getTitle() == null || request.getMessage() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title and message are required");
        }
        int count = notificationService.broadcastAnnouncement(
                request.getTitle(),
                request.getMessage(),
                request.getLink(),
                request.getCoachId()
        );
        return ResponseEntity.ok(Map.of("broadcastCount", count, "success", true));
    }
}
