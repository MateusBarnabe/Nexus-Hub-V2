package com.example.nexus.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Entidade que representa uma Pontuação/Score no sistema Nexus Score.
 *
 * Responsabilidades:
 * - Armazenar a pontuação obtida em um jogo
 * - Manter a relação entre Usuário e Jogo
 * - Armazenar metadata flexível (JSON) com dados específicos do jogo
 * - Registrar timestamp de quando o score foi registrado
 *
 * Padrão: Entity Model (Camada Model)
 * Princípios SOLID: Single Responsibility (SRP)
 *
 * A metadata permite que cada jogo armazene dados customizados sem alterar a estrutura
 * Exemplo: "{ \"distance\": 150, \"enemies_defeated\": 5, \"level\": 3 }"
 *
 * @author Nexus Score Team
 * @version 1.0
 */
@Entity
@Table(name = "scores", indexes = {
    @Index(name = "idx_user_game", columnList = "user_id,game_id"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Score {

    /**
     * Identificador único da pontuação
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Valor numérico da pontuação
     */
    @Column(nullable = false)
    private Integer value;

    /**
     * Referência para o Usuário que obteve a pontuação
     * Relacionamento: Muitas pontuações podem pertencer a um usuário
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Referência para o Jogo onde a pontuação foi obtida
     * Relacionamento: Muitas pontuações podem estar associadas a um jogo
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    /**
     * Metadata flexível em formato JSON para armazenar dados específicos do jogo
     * Permite extensibilidade sem alterar a estrutura do banco
     *
     * Exemplo de conteúdo:
     * {
     *   "distance": 150,
     *   "enemies_defeated": 5,
     *   "level": 3,
     *   "bonus_points": 25
     * }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String metadata;

    /**
     * Data e hora do registro da pontuação
     */
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

