package com.cpi.cpi_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SchemaUpdateRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE players DROP COLUMN IF EXISTS team_id CASCADE");
            System.out.println("Schema update successful: dropped team_id column from players if it existed.");
        } catch (Exception e) {
            System.err.println("Error performing schema update: " + e.getMessage());
        }
    }
}
