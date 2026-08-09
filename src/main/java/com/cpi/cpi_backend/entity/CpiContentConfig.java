package com.cpi.cpi_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cpi_content_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CpiContentConfig {

    @Id
    private String configKey; // Default "MAIN_CONFIG"

    @Column(columnDefinition = "TEXT")
    private String parametersJson;

    @Column(columnDefinition = "TEXT")
    private String helpJson;

    @Column(columnDefinition = "TEXT")
    private String instructionsJson;

    @Column(columnDefinition = "TEXT")
    private String recommendationsJson;

    @Column(columnDefinition = "TEXT")
    private String aiCoachJson;

    @Column(columnDefinition = "TEXT")
    private String reportsJson;

    @Column(columnDefinition = "TEXT")
    private String contentJson;

    @Column(columnDefinition = "TEXT")
    private String settingsJson;

    @Column(columnDefinition = "TEXT")
    private String termsJson;

    private LocalDateTime lastUpdatedAt;

    @Column(columnDefinition = "TEXT")
    private String changeLogsJson;

    @Column(columnDefinition = "TEXT")
    private String versionsJson;
}
