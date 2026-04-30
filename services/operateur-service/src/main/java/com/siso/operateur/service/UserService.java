package com.siso.operateur.service;

import com.siso.operateur.dto.CreateUserRequest;
import com.siso.operateur.model.AppUser;
import com.siso.operateur.model.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final PasswordEncoder passwordEncoder;

    // email → AppUser
    private final Map<String, AppUser> userStore = new ConcurrentHashMap<>();

    @Value("${app.admin.email:admin@siso.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@2025!}")
    private String adminPassword;

    /**
     * Crée le compte administrateur par défaut au démarrage.
     * L'admin peut ensuite créer les comptes opérateur et responsable.
     */
    @PostConstruct
    public void initDefaultAdmin() {
        AppUser admin = AppUser.builder()
                .id(UUID.randomUUID().toString())
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .fullName("Administrateur")
                .role(Role.ROLE_ADMIN)
                .active(true)
                .createdAt(Instant.now())
                .build();
        userStore.put(adminEmail, admin);
        log.info("✅ Compte admin initialisé: {}", adminEmail);
    }

    public Optional<AppUser> findByEmail(String email) {
        return Optional.ofNullable(userStore.get(email));
    }

    public AppUser createUser(CreateUserRequest req) {
        if (userStore.containsKey(req.getEmail())) {
            throw new IllegalArgumentException("Email déjà utilisé: " + req.getEmail());
        }
        if (req.getRole() == Role.ROLE_ADMIN) {
            throw new IllegalArgumentException("Impossible de créer un compte ADMIN via cette API.");
        }
        AppUser user = AppUser.builder()
                .id(UUID.randomUUID().toString())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(req.getRole())
                .active(true)
                .createdAt(Instant.now())
                .build();
        userStore.put(req.getEmail(), user);
        log.info("✅ Utilisateur créé: {} [{}]", req.getEmail(), req.getRole());
        return user;
    }

    public List<AppUser> listUsers() {
        return new ArrayList<>(userStore.values());
    }

    public boolean deleteUser(String email) {
        if (email.equals(adminEmail)) {
            throw new IllegalArgumentException("Impossible de supprimer le compte admin principal.");
        }
        return userStore.remove(email) != null;
    }

    public boolean verifyPassword(AppUser user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }
}
