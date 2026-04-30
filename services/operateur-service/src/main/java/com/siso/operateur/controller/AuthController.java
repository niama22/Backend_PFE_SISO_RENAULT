package com.siso.operateur.controller;

import com.siso.operateur.dto.LoginRequest;
import com.siso.operateur.dto.LoginResponse;
import com.siso.operateur.model.AppUser;
import com.siso.operateur.security.JwtUtil;
import com.siso.operateur.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    /**
     * Connexion — email attribué par l'admin, pas d'auto-inscription.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userService.findByEmail(request.getEmail())
                .filter(u -> u.isActive())
                .filter(u -> userService.verifyPassword(u, request.getPassword()))
                .map(u -> {
                    String token = jwtUtil.generateToken(u.getEmail(), u.getRole().name());
                    log.info("🔐 Connexion réussie: {} [{}]", u.getEmail(), u.getRole());
                    return ResponseEntity.ok(new LoginResponse(
                            token, u.getEmail(), u.getFullName(), u.getRole().name()));
                })
                .orElseGet(() -> {
                    log.warn("❌ Tentative de connexion échouée pour: {}", request.getEmail());
                    return ResponseEntity.status(401)
                            .body(new LoginResponse(null, null, null, "Email ou mot de passe incorrect"));
                });
    }
}
