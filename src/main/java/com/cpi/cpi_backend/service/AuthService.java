package com.cpi.cpi_backend.service;

import com.cpi.cpi_backend.dto.AuthenticationRequest;
import com.cpi.cpi_backend.dto.AuthenticationResponse;
import com.cpi.cpi_backend.dto.RegisterRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CoachRepository repository;
    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {

        // Always validate email is provided
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email address is required");
        }

        // Always check for duplicate email FIRST before doing anything else
        if (repository.findByEmail(request.getEmail().trim().toLowerCase()).isPresent()) {
            throw new RuntimeException("An account with this email address already exists");
        }

        boolean isPlayerRegistration = request.getInvitationCode() != null && !request.getInvitationCode().trim().isEmpty();

        if (isPlayerRegistration) {
            // ── PLAYER REGISTRATION ──

            var player = playerRepository.findByInvitationCode(request.getInvitationCode().trim())
                    .orElseThrow(() -> new RuntimeException("Invalid invitation code"));

            if (Boolean.TRUE.equals(player.getInvitationCodeActivated())) {
                throw new RuntimeException("Invitation code has already been activated");
            }

            var user = Coach.builder()
                    .name(player.getName())
                    .email(request.getEmail().trim().toLowerCase())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .build();
            repository.save(user);

            player.setInvitationCodeActivated(true);
            playerRepository.save(player);

            var jwtToken = jwtService.generateToken(user);
            return AuthenticationResponse.builder()
                    .token(jwtToken)
                    .build();

        } else {
            // ── COACH REGISTRATION ──
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                throw new RuntimeException("Name is required for coach registration");
            }

            var user = Coach.builder()
                    .name(request.getName().trim())
                    .email(request.getEmail().trim().toLowerCase())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .build();
            repository.save(user);

            var jwtToken = jwtService.generateToken(user);
            return AuthenticationResponse.builder()
                    .token(jwtToken)
                    .build();
        }
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        String inputEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        if ("cpicoach".equalsIgnoreCase(inputEmail) || "cpicoach@cpi.com".equalsIgnoreCase(inputEmail)) {
            inputEmail = "cpi@admin.com";
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            inputEmail,
                            request.getPassword()
                    )
            );
        } catch (org.springframework.security.core.AuthenticationException e) {
            // Admin auto-sync fallback: accept cpiadmin@10 or cpicoach@10
            if ("cpi@admin.com".equalsIgnoreCase(inputEmail)) {
                var adminOpt = repository.findByEmail("cpi@admin.com");
                if (adminOpt.isPresent()) {
                    Coach admin = adminOpt.get();
                    if ("cpiadmin@10".equals(request.getPassword()) || "cpicoach@10".equals(request.getPassword())) {
                        admin.setPassword(passwordEncoder.encode(request.getPassword()));
                        admin.setRole(Role.ADMIN);
                        repository.save(admin);
                        var token = jwtService.generateToken(admin);
                        return AuthenticationResponse.builder().token(token).build();
                    }
                } else {
                    // Create cpi@admin.com on the fly if missing
                    Coach admin = Coach.builder()
                            .name("CPI Master Admin")
                            .email("cpi@admin.com")
                            .password(passwordEncoder.encode(request.getPassword()))
                            .role(Role.ADMIN)
                            .build();
                    repository.save(admin);
                    var token = jwtService.generateToken(admin);
                    return AuthenticationResponse.builder().token(token).build();
                }
            }
            throw e;
        }

        var user = repository.findByEmail(inputEmail)
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    public java.util.Map<String, Object> validateCode(String code) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (code == null || code.trim().isEmpty()) {
            response.put("valid", false);
            response.put("message", "Code cannot be empty");
            return response;
        }

        var playerOpt = playerRepository.findByInvitationCode(code.trim());
        if (playerOpt.isEmpty()) {
            response.put("valid", false);
            response.put("message", "Invalid invitation code");
            return response;
        }

        var player = playerOpt.get();
        if (Boolean.TRUE.equals(player.getInvitationCodeActivated())) {
            response.put("valid", false);
            response.put("message", "Invitation code has already been activated");
            return response;
        }

        response.put("valid", true);
        response.put("playerName", player.getName());
        return response;
    }
}
