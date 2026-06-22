package com.cpi.cpi_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Connection;

@Component
@RequiredArgsConstructor
public class SchemaUpdateRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
            String dbProduct = conn.getMetaData().getDatabaseProductName();
            System.out.println("Schema update check: database product is " + dbProduct);
            
            boolean isPg = dbProduct.toLowerCase().contains("postgresql");
            String cascade = isPg ? " CASCADE" : "";

            // 1. Drop unused tables (reverse order of foreign keys)
            String[] tables = {
                "player_teams",
                "practice_sessions",
                "match_sessions",
                "teams",
                "organizations"
            };

            for (String table : tables) {
                try {
                    jdbcTemplate.execute("DROP TABLE IF EXISTS " + table + cascade);
                    System.out.println("Dropped table: " + table);
                } catch (Exception e) {
                    System.out.println("Drop table " + table + " failed/ignored: " + e.getMessage());
                }
            }

            // 2. Drop unused columns from remaining tables
            dropColumn("players", "team_id", cascade);
            dropColumn("players", "organization_id", cascade);
            dropColumn("coaches", "organization_id", cascade);
            dropColumn("coaches", "approval_status", cascade);
            dropColumn("practice_assessments", "session_id", cascade);
            dropColumn("practice_assessments", "date", cascade);
            dropColumn("match_assessments", "session_id", cascade);

        } catch (Exception e) {
            System.err.println("Critical error performing schema update: " + e.getMessage());
        }
    }

    private void dropColumn(String table, String column, String cascade) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + table + " DROP COLUMN IF EXISTS " + column + cascade);
            System.out.println("Dropped column " + column + " from table " + table);
        } catch (Exception e) {
            System.out.println("Drop column " + column + " from table " + table + " failed/ignored: " + e.getMessage());
        }
    }
}
