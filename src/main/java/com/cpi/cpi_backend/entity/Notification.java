package com.cpi.cpi_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notif_coach_created", columnList = "coach_id, created_at"),
    @Index(name = "idx_notif_coach_read", columnList = "coach_id, is_read"),
    @Index(name = "idx_notif_coach_dedup", columnList = "coach_id, dedup_key")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "authorities"})
    private Coach coach;

    @Column(nullable = false, length = 50)
    private String type; // ASSESSMENT_SAVED, SCORE_CHANGE, PLAYER_UPDATE, TEAM_UPDATE, SUBSCRIPTION, ANNOUNCEMENT

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(length = 255)
    private String link;

    @Column(length = 50)
    private String entityType;

    private Long entityId;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "dedup_key", length = 120)
    private String dedupKey;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
