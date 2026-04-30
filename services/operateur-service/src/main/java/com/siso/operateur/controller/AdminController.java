package com.siso.operateur.controller;

import com.siso.operateur.dto.CreateUserRequest;
import com.siso.operateur.dto.UserResponse;
import com.siso.operateur.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Endpoints réservés à l'ADMIN.
 * Seul l'admin peut créer et gérer les comptes opérateur / responsable.
 * Il n'y a pas de self-registration.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final UserService userService;

    /**
     * Lister tous les utilisateurs (sans les mots de passe).
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> listUsers() {
        List<UserResponse> users = userService.listUsers()
                .stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /**
     * Créer un compte opérateur ou responsable.
     * Le mot de passe initial est attribué par l'admin.
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        try {
            var user = userService.createUser(request);
            return ResponseEntity.ok(UserResponse.from(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Supprimer un compte utilisateur.
     */
    @DeleteMapping("/{email}")
    public ResponseEntity<?> deleteUser(@PathVariable String email) {
        try {
            boolean deleted = userService.deleteUser(email);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé: " + email));
            }
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
