package com.siso.operateur.dto;

import com.siso.operateur.model.Role;
import lombok.Data;

@Data
public class CreateUserRequest {
    private String email;
    private String password;
    private String fullName;
    private Role role; // ROLE_OPERATEUR or ROLE_RESPONSABLE
}
