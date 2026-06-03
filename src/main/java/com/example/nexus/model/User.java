package com.example.nexus.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entidade que representa um Usuário no sistema Nexus Score.
 *
 * Responsabilidades:
 * - Armazenar os dados do usuário (nome, email, senha)
 * - Manter o papel (role) do usuário
 * - Registrar timestamps de criação e atualização
 *
 * Padrão: Entity Model (Camada Model)
 * Princípios SOLID: Single Responsibility (SRP)
 *
 * @author Nexus Score Team
 * @version 1.0
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_email", columnList = "email", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    /**
     * Identificador único do usuário
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nome do usuário
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Email único do usuário - utilizado como identificador secundário
     */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /**
     * Senha do usuário (deve ser armazenada com hash)
     */
    @Column(nullable = false)
    private String password;

    /**
     * Papel/Role do usuário no sistema
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    /**
     * Data e hora de criação do usuário
     */
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Data e hora da última atualização do usuário
     */
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

