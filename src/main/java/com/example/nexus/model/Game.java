package com.example.nexus.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entidade que representa um Jogo no Hub de Jogos Nexus Score.
 *
 * Responsabilidades:
 * - Armazenar informações básicas do jogo (título, slug, categoria, descrição)
 * - Manter a identificação única do jogo através de slug
 * - Registrar timestamps de criação e atualização
 *
 * Padrão: Entity Model (Camada Model)
 * Princípios SOLID: Single Responsibility (SRP)
 *
 * @author Nexus Score Team
 * @version 1.0
 */
@Entity
@Table(name = "games", indexes = {
    @Index(name = "idx_slug", columnList = "slug", unique = true),
    @Index(name = "idx_category", columnList = "category")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    /**
     * Identificador único do jogo
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Título do jogo
     */
    @Column(nullable = false, length = 100)
    private String title;

    /**
     * Slug único do jogo - utilizado para identificação em URLs e estratégias
     * Ex: "dino-game", "flappy-bird"
     */
    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    /**
     * Categoria do jogo
     * Ex: "arcade", "puzzle", "action"
     */
    @Column(nullable = false, length = 50)
    private String category;

    /**
     * Descrição detalhada do jogo
     */
    @Column(length = 500)
    private String description;

    /**
     * URL de capa do jogo
     */
    @Column(name = "image_url")
    private String imageUrl;

    /**
     * URL de execução do jogo (Vercel ou servidor externo)
     */
    @Column(name = "launch_url")
    private String launchUrl;

    /**
     * Define se o jogo roda em Iframe (embed) ou aba externa
     */
    @Column(name = "embed")
    @Builder.Default
    private Boolean embed = true;

    /**
     * Define se o jogo está ativo no catálogo
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Data e hora de criação do jogo no sistema
     */
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Data e hora da última atualização do jogo
     */
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

