package com.cpi.cpi_backend.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

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

    @Value("${emailjs.template.id:template_reset_password}")
    private String templateId;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

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
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String originUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "http://localhost:3000";
            headers.set("Origin", originUrl);
            headers.set("Referer", originUrl + "/");
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            Map<String, Object> templateParams = new HashMap<>();
            templateParams.put("to_email", recipientEmail);
            templateParams.put("to_name", (recipientName != null && !recipientName.isBlank()) ? recipientName : recipientEmail);
            templateParams.put("user_name", (recipientName != null && !recipientName.isBlank()) ? recipientName : recipientEmail);
            templateParams.put("email", recipientEmail);
            templateParams.put("user_email", recipientEmail);
            templateParams.put("reset_link", resetUrl);
            templateParams.put("link", resetUrl);
            templateParams.put("reset_url", resetUrl);
            templateParams.put("expiry_minutes", "15");

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("service_id", serviceId);
            requestPayload.put("template_id", templateId);
            requestPayload.put("user_id", publicKey);
            if (privateKey != null && !privateKey.isBlank()) {
                requestPayload.put("accessToken", privateKey);
            }
            requestPayload.put("template_params", templateParams);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);

            log.info("[EmailJS] Dispatching reset email via Service: {}, Template: {} to {}", 
                    serviceId, templateId, recipientEmail);

            ResponseEntity<String> response = restTemplate.postForEntity(EMAILJS_API_URL, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[EmailJS] Successfully dispatched password reset email to {}", recipientEmail);
                return new EmailSendResult(true, response.getStatusCode().value(), null);
            } else {
                log.warn("[EmailJS] Received non-200 status code: {} - {}", response.getStatusCode(), response.getBody());
                return new EmailSendResult(false, response.getStatusCode().value(), "EmailJS returned status " + response.getStatusCode());
            }
        } catch (HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            int statusCode = ex.getStatusCode().value();
            log.error("[EmailJS] HTTP Error {} while sending email to {}: {}", statusCode, recipientEmail, errorBody);

            String descriptiveError;
            if (statusCode == 400 && errorBody.toLowerCase().contains("template id not found")) {
                descriptiveError = "EmailJS Template ID '" + templateId + "' not found. Please set your correct Template ID in application.properties or EMAILJS_TEMPLATE_ID environment variable.";
            } else if (statusCode == 403 && errorBody.toLowerCase().contains("non-browser")) {
                descriptiveError = "EmailJS non-browser API access disabled. Please enable 'Allow API requests from non-browser environments' in your EmailJS Security settings.";
            } else {
                descriptiveError = "Email service returned error: " + errorBody;
            }

            return new EmailSendResult(false, statusCode, descriptiveError);
        } catch (Exception ex) {
            log.error("[EmailJS] Failed to send password reset email to {}: {}", recipientEmail, ex.getMessage(), ex);
            return new EmailSendResult(false, 500, "Failed to connect to email service: " + ex.getMessage());
        }
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }
}
