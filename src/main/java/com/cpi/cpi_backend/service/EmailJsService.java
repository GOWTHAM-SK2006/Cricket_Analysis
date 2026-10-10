package com.cpi.cpi_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class EmailJsService {

    @Value("${emailjs.service.id:service_sna4bhn}")
    private String serviceId;

    @Value("${emailjs.public.key:7CbeUxPc80DgrWhTF}")
    private String publicKey;

    @Value("${emailjs.private.key:l1xiu3a3RBWXjqo0PQUUm}")
    private String privateKey;

    @Value("${emailjs.template.id:template_1m7vlod}")
    private String templateId;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

    @Getter
    @AllArgsConstructor
    public static class EmailSendResult {
        private final boolean success;
        private final int statusCode;
        private final String errorMessage;
    }

    public EmailSendResult sendPasswordResetEmail(String recipientEmail, String recipientName, String resetToken) {
        String resetUrl = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + resetToken;

        log.info("[Password Reset] Generated secure reset link for {}: {}", recipientEmail, resetUrl);

        try {
            String originUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "http://localhost:3000";

            Map<String, Object> templateParams = new HashMap<>();
            templateParams.put("to_email", recipientEmail);
            templateParams.put("to_name", (recipientName != null && !recipientName.isBlank()) ? recipientName : recipientEmail);
            templateParams.put("user_name", (recipientName != null && !recipientName.isBlank()) ? recipientName : recipientEmail);
            templateParams.put("email", recipientEmail);
            templateParams.put("user_email", recipientEmail);
            templateParams.put("reset_link", resetUrl);
            templateParams.put("link", resetUrl);
            templateParams.put("reset_url", resetUrl);
            templateParams.put("url", resetUrl);
            templateParams.put("message", resetUrl);
            templateParams.put("expiry_minutes", "15");

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("service_id", serviceId);
            requestPayload.put("template_id", templateId);
            requestPayload.put("user_id", publicKey);
            if (privateKey != null && !privateKey.isBlank()) {
                requestPayload.put("accessToken", privateKey);
            }
            requestPayload.put("template_params", templateParams);

            String jsonBody = objectMapper.writeValueAsString(requestPayload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(EMAILJS_API_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .header("Origin", originUrl)
                    .header("Referer", originUrl + "/")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            log.info("[EmailJS] Dispatching reset email via Service: {}, Template: {} to {}", 
                    serviceId, templateId, recipientEmail);

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int statusCode = response.statusCode();
            String responseBody = response.body();

            if (statusCode >= 200 && statusCode < 300) {
                log.info("[EmailJS] Successfully dispatched password reset email to {} (status: {})", recipientEmail, statusCode);
                return new EmailSendResult(true, statusCode, null);
            } else {
                log.error("[EmailJS] Delivery failed with HTTP {}: {}", statusCode, responseBody);

                String descriptiveError;
                if (statusCode == 400 && responseBody.toLowerCase().contains("template id not found")) {
                    descriptiveError = "EmailJS Template ID '" + templateId + "' not found. Please verify the template ID in your EmailJS dashboard.";
                } else if (statusCode == 403 && responseBody.toLowerCase().contains("non-browser")) {
                    descriptiveError = "EmailJS non-browser API access disabled. Please enable 'Allow API requests from non-browser environments' in your EmailJS Security settings.";
                } else {
                    descriptiveError = "Email service returned error (" + statusCode + "): " + responseBody;
                }

                return new EmailSendResult(false, statusCode, descriptiveError);
            }
        } catch (Exception ex) {
            log.error("[EmailJS] Exception while sending password reset email to {}: {}", recipientEmail, ex.getMessage(), ex);
            return new EmailSendResult(false, 500, "Failed to connect to email service: " + ex.getMessage());
        }
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }
}
