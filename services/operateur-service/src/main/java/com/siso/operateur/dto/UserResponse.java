package com.siso.operateur.dto;

import com.siso.operateur.model.AppUser;
import com.siso.operateur.model.Role;
import lombok.Data;

import java.time.Instant;

@Data
public class UserResponse {
    private String id;
    private String email;
    private String fullName;
    private Role role;
    private boolean active;
    private Instant createdAt;

    public static UserResponse from(AppUser user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setEmail(user.getEmail());
        r.setFullName(user.getFullName());
        r.setRole(user.getRole());
        r.setActive(user.isActive());
        r.setCreatedAt(user.getCreatedAt());
        return r;
    }
}
