package com.cpi.cpi_backend.service;

import com.cpi.cpi_backend.dto.NotificationResponse;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Notification;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.NotificationRepository;
import com.cpi.cpi_backend.repository.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:notificationdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.cache.type=none",
    "cpi.notification.score-change-threshold=2.0"
})
public class NotificationServiceTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CoachRepository coachRepository;

    @Autowired
    private PlayerRepository playerRepository;

    private Coach coachA;
    private Coach coachB;
    private Player playerA;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        playerRepository.deleteAll();
        coachRepository.deleteAll();

        coachA = coachRepository.save(Coach.builder()
                .name("Coach Alpha")
                .email("alpha@cpicoach.com")
                .password("secret123")
                .role(Role.USER)
                .build());

        coachB = coachRepository.save(Coach.builder()
                .name("Coach Beta")
                .email("beta@cpicoach.com")
                .password("secret123")
                .role(Role.USER)
                .build());

        playerA = playerRepository.save(Player.builder()
                .name("Virat Test")
                .role("Batsman")
                .creatorCoach(coachA)
                .ppiScore(70.0)
                .mpiScore(75.0)
                .build());
    }

    @Test
    void testCreateAndFetchNotifications() {
        notificationService.notifyAssessmentSaved(coachA, playerA, "Practice", 82.0, 101L);

        List<NotificationResponse> listA = notificationService.getNotifications(coachA, false);
        assertEquals(1, listA.size());
        assertEquals("Practice Assessment Recorded", listA.get(0).getTitle());
        assertEquals("/history?playerId=" + playerA.getId(), listA.get(0).getLink());
        assertFalse(listA.get(0).getIsRead());

        // Verify coach isolation: coachB should NOT see coachA's notification
        List<NotificationResponse> listB = notificationService.getNotifications(coachB, false);
        assertEquals(0, listB.size());
    }

    @Test
    void testDeduplicationPreventsDuplicates() {
        notificationService.notifyAssessmentSaved(coachA, playerA, "Practice", 82.0, 101L);
        // Second attempt with identical dedup key (e.g. double click)
        notificationService.notifyAssessmentSaved(coachA, playerA, "Practice", 82.0, 101L);

        List<NotificationResponse> listA = notificationService.getNotifications(coachA, false);
        assertEquals(1, listA.size(), "Deduplication must prevent duplicate notifications");
    }

    @Test
    void testScoreChangeThreshold() {
        // Change from 70.0 to 71.0 (diff = 1.0 < threshold 2.0) -> No notification
        notificationService.checkAndNotifyScoreChange(coachA, playerA, "PPI", 70.0, 71.0, 72.5, 73.0, 201L);
        assertEquals(0, notificationService.getNotifications(coachA, false).size());

        // Change from 70.0 to 75.0 (diff = 5.0 >= threshold 2.0) -> Should notify
        notificationService.checkAndNotifyScoreChange(coachA, playerA, "PPI", 70.0, 75.0, 72.5, 75.0, 202L);
        List<NotificationResponse> list = notificationService.getNotifications(coachA, false);
        assertEquals(1, list.size());
        assertTrue(list.get(0).getTitle().contains("Score Improvement"));
    }

    @Test
    void testMarkAsReadAndMarkAllAsRead() {
        notificationService.notifyPlayerAction(coachA, playerA, "ADDED");
        notificationService.notifyPlayerAction(coachA, playerA, "UPDATED");

        assertEquals(2, notificationService.getUnreadCount(coachA));

        List<NotificationResponse> list = notificationService.getNotifications(coachA, false);
        Long firstId = list.get(0).getId();

        notificationService.markAsRead(coachA, firstId);
        assertEquals(1, notificationService.getUnreadCount(coachA));

        notificationService.markAllAsRead(coachA);
        assertEquals(0, notificationService.getUnreadCount(coachA));
    }

    @Test
    void testClearAllNotifications() {
        notificationService.notifyPlayerAction(coachA, playerA, "ADDED");
        assertEquals(1, notificationService.getNotifications(coachA, false).size());

        notificationService.clearAllNotifications(coachA);
        assertEquals(0, notificationService.getNotifications(coachA, false).size());
    }
}
