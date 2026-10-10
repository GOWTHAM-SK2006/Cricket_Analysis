package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.AuthenticationRequest;
import com.cpi.cpi_backend.dto.AuthenticationResponse;
import com.cpi.cpi_backend.dto.RegisterRequest;
import com.cpi.cpi_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/signup")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request
    ) {
        try {
            return ResponseEntity.ok(service.register(request));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(409)
                    .body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(
            @RequestBody java.util.Map<String, String> request
    ) {
        try {
            return ResponseEntity.ok(service.googleAuth(request));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(400)
                    .body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.GetMapping("/validate-code")
    public ResponseEntity<java.util.Map<String, Object>> validateCode(
            @org.springframework.web.bind.annotation.RequestParam String code
    ) {
        return ResponseEntity.ok(service.validateCode(code));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody com.cpi.cpi_backend.dto.ForgotPasswordRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        try {
            String originHeader = httpRequest.getHeader("Origin");
            String refererHeader = httpRequest.getHeader("Referer");
            String hostHeader = httpRequest.getHeader("Host");
            String forwardedHost = httpRequest.getHeader("X-Forwarded-Host");
            String forwardedProto = httpRequest.getHeader("X-Forwarded-Proto");

            String resolvedBaseUrl = null;
            if (originHeader != null && !originHeader.isBlank()) {
                resolvedBaseUrl = originHeader.trim();
            } else if (refererHeader != null && !refererHeader.isBlank()) {
                try {
                    java.net.URI uri = java.net.URI.create(refererHeader.trim());
                    resolvedBaseUrl = uri.getScheme() + "://" + uri.getAuthority();
                } catch (Exception ignored) {}
            } else if (forwardedHost != null && !forwardedHost.isBlank()) {
                String proto = (forwardedProto != null && !forwardedProto.isBlank()) ? forwardedProto : "https";
                resolvedBaseUrl = proto + "://" + forwardedHost.trim();
            } else if (hostHeader != null && !hostHeader.isBlank()) {
                String proto = httpRequest.isSecure() ? "https" : "http";
                resolvedBaseUrl = proto + "://" + hostHeader.trim();
            }

            return ResponseEntity.ok(service.forgotPassword(request, resolvedBaseUrl));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.GetMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(
            @org.springframework.web.bind.annotation.RequestParam String token
    ) {
        return ResponseEntity.ok(service.validateResetToken(token));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody com.cpi.cpi_backend.dto.ResetPasswordRequest request
    ) {
        try {
            return ResponseEntity.ok(service.resetPassword(request));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(java.util.Map.of("message", e.getMessage()));
        }
    }
}
