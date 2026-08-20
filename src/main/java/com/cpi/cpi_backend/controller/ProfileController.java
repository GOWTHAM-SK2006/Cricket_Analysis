package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.repository.CoachRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private CoachRepository coachRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal Coach currentCoach) {
        if (currentCoach == null) {
            return ResponseEntity.status(401).build();
        }

        Coach coach = coachRepository.findById(currentCoach.getId()).orElse(currentCoach);

        Map<String, Object> response = new HashMap<>();
        response.put("id", coach.getId());
        response.put("name", coach.getName());
        response.put("email", coach.getEmail());
        response.put("role", coach.getRole().name());
        response.put("approvalStatus", "APPROVED");
        response.put("organizationName", coach.getOrganizationName() != null ? coach.getOrganizationName() : "CPI Cricket Academy");
        response.put("companyName", coach.getOrganizationName() != null ? coach.getOrganizationName() : "CPI Cricket Academy");
        response.put("avatarUrl", coach.getAvatarUrl());
        response.put("imageUrl", coach.getAvatarUrl());
        response.put("organization", Map.of("name", coach.getOrganizationName() != null ? coach.getOrganizationName() : "CPI Cricket Academy"));

        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal Coach currentCoach,
            @RequestBody Map<String, String> request) {
        if (currentCoach == null) {
            return ResponseEntity.status(401).build();
        }

        Coach coach = coachRepository.findById(currentCoach.getId()).orElse(null);
        if (coach == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.containsKey("avatarUrl")) {
            coach.setAvatarUrl(request.get("avatarUrl"));
        }
        if (request.containsKey("organizationName")) {
            coach.setOrganizationName(request.get("organizationName"));
        }
        if (request.containsKey("companyName")) {
            coach.setOrganizationName(request.get("companyName"));
        }

        Coach updated = coachRepository.save(coach);

        Map<String, Object> response = new HashMap<>();
        response.put("id", updated.getId());
        response.put("name", updated.getName());
        response.put("email", updated.getEmail());
        response.put("role", updated.getRole().name());
        response.put("avatarUrl", updated.getAvatarUrl());
        response.put("imageUrl", updated.getAvatarUrl());
        response.put("organizationName", updated.getOrganizationName() != null ? updated.getOrganizationName() : "CPI Cricket Academy");
        response.put("companyName", updated.getOrganizationName() != null ? updated.getOrganizationName() : "CPI Cricket Academy");

        return ResponseEntity.ok(response);
    }
}
