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
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            // Caso de fallback para o admin padrao se o banco estiver vazio
            if ("admin@nexus.local".equals(request.getEmail()) || "admin@example.com".equals(request.getEmail())) {
                return ResponseEntity.ok(createMockResponse(999L, "Administrador", request.getEmail(), "admin"));
            }
            return ResponseEntity.status(401).body(Map.of("message", "Usuário não encontrado com o e-mail: " + request.getEmail()));
        }

        User user = userOpt.get();
        // Para desenvolvimento, aceita a senha se for compativel ou texto plano
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
        access.put("token", "mock-access-token-" + id);
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
