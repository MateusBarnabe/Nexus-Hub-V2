package com.example.nexus.controller;

import com.example.nexus.model.User;
import com.example.nexus.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Controller para autenticacao simplificada compativel com o frontend do Boilerplate.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "E-mail e senha são obrigatórios."));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Credenciais inválidas."));
        }

        User user = userOpt.get();
        if (!request.getPassword().equals(user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Credenciais inválidas."));
        }

        String roleStr = user.getRole() != null ? user.getRole().name().toLowerCase() : "user";
        return ResponseEntity.ok(createMockResponse(user.getId(), user.getName(), user.getEmail(), roleStr));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logout realizado com sucesso"));
    }

    private Map<String, Object> createMockResponse(Long id, String name, String email, String role) {
        Map<String, Object> response = new HashMap<>();
        
        Map<String, Object> tokens = new HashMap<>();
        Map<String, Object> access = new HashMap<>();
        String tokenPrefix = "admin".equalsIgnoreCase(role) ? "mock-access-token-admin-" : "mock-access-token-";
        access.put("token", tokenPrefix + id);
        Map<String, Object> refresh = new HashMap<>();
        refresh.put("token", "mock-refresh-token-" + id);
        
        tokens.put("access", access);
        tokens.put("refresh", refresh);
        
        Map<String, Object> user = new HashMap<>();
        user.put("id", id);
        user.put("name", name);
        user.put("email", email);
        user.put("role", role);
        
        response.put("tokens", tokens);
        response.put("user", user);
        
        return response;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }
}
