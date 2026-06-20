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
            
            if (dbProduct.toLowerCase().contains("postgresql")) {
                // Drop team_id constraints and column on PostgreSQL
                try {
                    jdbcTemplate.execute("ALTER TABLE players ALTER COLUMN team_id DROP NOT NULL");
                    System.out.println("PostgreSQL: Altered team_id to drop NOT NULL constraint.");
                } catch (Exception e) {
                    System.out.println("PostgreSQL team_id alter failed/ignored: " + e.getMessage());
                }
                
                try {
                    jdbcTemplate.execute("ALTER TABLE players DROP COLUMN IF EXISTS team_id CASCADE");
                    System.out.println("PostgreSQL: Dropped team_id column with CASCADE.");
                } catch (Exception e) {
                    System.out.println("PostgreSQL team_id drop failed: " + e.getMessage());
                }
            } else {
                // H2/Other DBs
                try {
                    jdbcTemplate.execute("ALTER TABLE players ALTER COLUMN team_id SET NULL");
                    System.out.println("H2: Altered team_id to SET NULL.");
                } catch (Exception e) {
                    System.out.println("H2 team_id alter failed/ignored: " + e.getMessage());
                }
                
                try {
                    jdbcTemplate.execute("ALTER TABLE players DROP COLUMN IF EXISTS team_id");
                    System.out.println("H2: Dropped team_id column.");
                } catch (Exception e) {
                    System.out.println("H2 team_id drop failed: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Critical error performing schema update: " + e.getMessage());
        }
    }
}
