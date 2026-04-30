package com.siso.operateur.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppUser {
    private String id;
    private String email;
    private String password; // BCrypt encoded
    private String fullName;
    private Role role;
    private boolean active;
    private Instant createdAt;
}
