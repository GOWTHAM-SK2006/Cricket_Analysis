package com.cpi.cpi_backend.service;

import com.cpi.cpi_backend.entity.Organization;
import com.cpi.cpi_backend.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds the default Organization row on startup so that the foreign key
 * constraint on teams.organization_id is always satisfiable.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;

    @Override
    public void run(String... args) {
        if (organizationRepository.count() == 0) {
            organizationRepository.save(
                    Organization.builder()
                            .name("Default Academy")
                            .build()
            );
        }
    }
}
