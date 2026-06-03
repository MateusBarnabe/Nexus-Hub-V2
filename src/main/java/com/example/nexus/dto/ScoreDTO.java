package com.example.nexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object para transferência de dados de Score
 * 
 * Responsabilidades:
 * - Transportar dados de entrada/saída da API
 * - Isolar a entidade Score das requisições HTTP
 * - Facilitar validação de dados de entrada
 * 
 * Padrão: Data Transfer Object (DTO)
 * Princípios SOLID: Interface Segregation (ISP)
 * 
 * @author Nexus Score Team
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreDTO {

    /**
     * Identificador da pontuação (preenchido apenas em respostas)
     */
    private Long id;

    /**
     * Valor numérico da pontuação calculada
     */
    private Integer value;

    /**
     * Identificador do usuário que obteve a pontuação
     */
    private Long userId;

    /**
     * Nome do usuário (preenchido apenas em respostas)
     */
    private String userName;

    /**
     * Slug único do jogo para identificar qual strategy usar
     */
    private String gameSlug;

    /**
     * Título do jogo (preenchido apenas em respostas)
     */
    private String gameTitle;

    /**
     * Metadata flexível contendo dados específicos do jogo em formato JSON
     * Exemplo: { "distance": 150, "enemies_defeated": 5 }
     */
    private String metadata;

    /**
     * Timestamp de criação do score (preenchido apenas em respostas)
     */
    private String createdAt;
}

