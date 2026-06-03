package com.example.nexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object para transferência de dados de Standings (Placar)
 *
 * Responsabilidades:
 * - Transportar dados de um ranking/standing via WebSocket
 * - Manter dados consolidados de score com informações do usuário
 *
 * Padrão: Data Transfer Object (DTO)
 * Princípios SOLID: Single Responsibility (SRP)
 *
 * @author Nexus Score Team
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StandingsDTO {

    /**
     * Posição/Ranking na tabela de classificação
     */
    private Integer position;

    /**
     * Nome do usuário
     */
    private String userName;

    /**
     * Pontuação total do usuário
     */
    private Integer score;

    /**
     * Slug do jogo
     */
    private String gameSlug;

    /**
     * Título do jogo
     */
    private String gameTitle;

    /**
     * Timestamp da último score registrado
     */
    private String lastScoreTime;
}

