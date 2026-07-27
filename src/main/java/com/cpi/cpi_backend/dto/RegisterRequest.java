package com.cpi.cpi_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private boolean createOrganization;     
    private String organizationName;
    private String organizationType;
    private String sport;
    private String country;
    private String city;
    private String description;
    private String joinCode;
    private String invitationCode;
}