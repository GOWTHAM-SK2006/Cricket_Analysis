package com.cpi.cpi_backend.service;

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

    public boolean sendPasswordResetEmail(String recipientEmail, String recipientName, String resetToken) {
        String resetUrl = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + resetToken;

        log.info("[Password Reset] Generated reset link for {}: {}", recipientEmail, resetUrl);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

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

            log.info("[EmailJS] Sending password reset email via Service ID: {}, Template ID: {} to {}", 
                    serviceId, templateId, recipientEmail);

            ResponseEntity<String> response = restTemplate.postForEntity(EMAILJS_API_URL, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[EmailJS] Successfully dispatched password reset email to {}", recipientEmail);
                return true;
            } else {
                log.warn("[EmailJS] Received non-200 status code: {} - {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (HttpStatusCodeException ex) {
            log.error("[EmailJS] HTTP Error {} while sending email to {}: {}", 
                    ex.getStatusCode(), recipientEmail, ex.getResponseBodyAsString());
            log.warn("[EmailJS Configuration Check] Ensure EmailJS Service '{}' and Template '{}' exist in your EmailJS dashboard.",
                    serviceId, templateId);
            return false;
        } catch (Exception ex) {
            log.error("[EmailJS] Failed to send password reset email to {}: {}", recipientEmail, ex.getMessage(), ex);
            return false;
        }
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }
}
