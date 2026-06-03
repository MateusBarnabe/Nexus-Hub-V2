package com.example.nexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object para transferência de dados de Game
 * 
 * Responsabilidades:
 * - Transportar dados do jogo na API
 * - Isolar a entidade Game das requisições HTTP
 * - Facilitar exposição segura de dados do jogo
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
public class GameDTO {

    /**
     * Identificador único do jogo
     */
    private Long id;

    /**
     * Título do jogo
     */
    private String title;

    /**
     * Slug único do jogo
     */
    private String slug;

    /**
     * Categoria do jogo
     */
    private String category;

    /**
     * Descrição do jogo
     */
    private String description;

    private String imageUrl;

    private Config config;

    private Boolean isActive;

    /**
     * Timestamp de criação (preenchido apenas em respostas)
     */
    private String createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Config {
        private String launchUrl;
        private Boolean embed;
    }
}

