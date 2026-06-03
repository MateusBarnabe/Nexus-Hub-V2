package com.example.nexus.service.strategy;

import com.example.nexus.dto.ScoreDTO;

/**
 * Interface que define o contrato para cálculo de scores de diferentes jogos.
 * 
 * Responsabilidades:
 * - Definir o contrato para cálculo de scores específicos de cada jogo
 * - Permitir que cada jogo implemente sua própria lógica de cálculo
 * 
 * Padrão: Strategy Pattern
 * Princípios SOLID: 
 *   - Open/Closed (OCP): Aberto para extensão (novos jogos), fechado para modificação
 *   - Single Responsibility (SRP): Cada strategy é responsável por calcular score de um jogo
 *   - Liskov Substitution (LSP): Qualquer implementação pode ser usada no lugar da interface
 *   - Interface Segregation (ISP): Interface mínima e coesa
 *   - Dependency Inversion (DIP): Código depende de abstração, não de implementações
 * 
 * @author Nexus Score Team
 * @version 1.0
 */
public interface GameScoreStrategy {

    /**
     * Calcula a pontuação baseada nos dados fornecidos
     * Cada implementação define a lógica específica de cálculo para seu jogo
     * 
     * @param data Dados do score contendo informações do jogo e metadata
     * @return Valor calculado da pontuação
     */
    int calculateScore(ScoreDTO data);

    /**
     * Retorna o slug único do jogo que esta strategy é responsável
     * Utilizado para identificar qual strategy usar para cada jogo
     * 
     * @return Slug do jogo (ex: "dino-game", "flappy-bird")
     */
    String getGameSlug();
}

