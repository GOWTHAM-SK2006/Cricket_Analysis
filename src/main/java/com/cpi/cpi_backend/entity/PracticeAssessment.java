package com.cpi.cpi_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "practice_assessments", indexes = {
    @Index(name = "idx_prac_player_date", columnList = "player_id, session_date")
})
public class PracticeAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "player_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "creatorCoach"})
    private Player player;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "coach_id", nullable = false)
    private Coach coach;

    @Column(name = "session_date", nullable = false)
    private LocalDate date;

    private Integer technicalExecution;
    private Integer skillsLevel;
    private Integer gamePlan;
    private Integer preparation;
    private Integer intensity;
    private Integer focus;
    private Integer resilience;
    private Integer concentration;
    private Integer decisionMaking;
    private Integer gameAwareness;
    private Integer adaptability;
    private Integer discipline;
    private Integer teamwork;
    private Integer coachability;
    private Integer workEthic;
    private Integer emotionalControl;

    private Double ppiScore;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
