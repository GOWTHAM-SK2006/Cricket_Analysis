package com.cpi.cpi_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        HttpStatus status = "Unauthorized".equals(ex.getMessage())
                ? HttpStatus.FORBIDDEN
                : HttpStatus.BAD_REQUEST;

        return ResponseEntity.status(status).body(Map.of(
                "message", ex.getMessage(),
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "message", "An unexpected error occurred. Please try again.",
                "timestamp", LocalDateTime.now().toString(),
                "status", 500
        ));
    }
}
