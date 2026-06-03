package com.example.nexus.service.strategy;

import com.example.nexus.dto.ScoreDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Implementação da Strategy para cálculo de score do jogo "Flappy Bird"
 * 
 * Lógica de Cálculo:
 * - Pontuação base é a quantidade de tubos passados
 * - Bônus por pontos de ouro coletados: cada ouro vale 5 pontos
 * - Bônus por sequência perfeita: 50 pontos extras se sem colisões
 * 
 * Exemplo:
 * - Tubes passed: 30
 * - Gold coins: 10
 * - Perfect sequence: true
 * - Cálculo: 30 + (10 * 5) + 50 = 130 pontos
 * 
 * Responsabilidades:
 * - Implementar a lógica específica de cálculo para o jogo Flappy Bird
 * - Extrair dados metadata em JSON
 * - Retornar o score calculado
 * 
 * Padrão: Strategy Pattern (Implementação Concreta)
 * Princípios SOLID: Single Responsibility (SRP)
 * 
 * @author Nexus Score Team
 * @version 1.0
 */
@Slf4j
@Component
public class FlappyBirdGameStrategy implements GameScoreStrategy {

    private static final String GAME_SLUG = "flappy-bird";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public int calculateScore(ScoreDTO data) {
        log.info("Calculando score para Flappy Bird com data: {}", data);

        try {
            // Valor base é a quantidade de tubos passados
            int baseScore = data.getValue() != null ? data.getValue() : 0;

            // Se houver metadata, extrair bônus adicionais
            if (data.getMetadata() != null && !data.getMetadata().isEmpty()) {
                var metadata = objectMapper.readTree(data.getMetadata());

                // Bônus por ouro coletado
                int goldCoins = metadata.has("gold_coins") 
                    ? metadata.get("gold_coins").asInt() 
                    : 0;
                int goldBonus = goldCoins * 5;

                // Bônus por sequência perfeita (sem colisões)
                boolean perfectSequence = metadata.has("perfect_sequence") 
                    && metadata.get("perfect_sequence").asBoolean();
                int perfectBonus = perfectSequence ? 50 : 0;

                // Cálculo final
                int finalScore = baseScore + goldBonus + perfectBonus;
                
                log.info("Score calculado para Flappy Bird: base={}, goldBonus={}, perfectBonus={}, final={}",
                    baseScore, goldBonus, perfectBonus, finalScore);
                
                return finalScore;
            }

            log.info("Score calculado para Flappy Bird (sem metadata): {}", baseScore);
            return baseScore;

        } catch (Exception e) {
            log.error("Erro ao calcular score para Flappy Bird", e);
            return data.getValue() != null ? data.getValue() : 0;
        }
    }

    @Override
    public String getGameSlug() {
        return GAME_SLUG;
    }
}

