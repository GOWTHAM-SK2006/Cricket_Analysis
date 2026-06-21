package com.cpi.cpi_backend.service;

import com.cpi.cpi_backend.entity.Organization;
import com.cpi.cpi_backend.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Seeds the default Organization row on startup so that the foreign key
 * constraint on teams.organization_id is always satisfiable, and cleans up obsolete columns.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE match_assessments DROP COLUMN IF EXISTS match_date;");
        } catch (Exception e) {
            System.err.println("Could not drop match_date column: " + e.getMessage());
        }

        if (organizationRepository.count() == 0) {
            organizationRepository.save(
                    Organization.builder()
                            .name("Default Academy")
                            .joinCode(UUID.randomUUID().toString().substring(0, 8))
                            .build()
            );
        }
    }
}
