package com.example.nexus.service.strategy;

import com.example.nexus.dto.ScoreDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Implementação da Strategy para cálculo de score do jogo "Dino Game"
 * 
 * Lógica de Cálculo:
 * - Pontuação base é o valor enviado (distância percorrida)
 * - Bônus por inimigos derrotados: cada inimigo vale 10 pontos
 * - Bônus de nível: multiplicador de 1.2x ^ (nível - 1)
 * 
 * Exemplo:
 * - Distance: 150
 * - Enemies defeated: 5
 * - Level: 2
 * - Cálculo: (150 + (5 * 10)) * (1.2 ^ 1) = 150 * 1.2 = 180 pontos
 * 
 * Responsabilidades:
 * - Implementar a lógica específica de cálculo para o jogo Dino
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
public class DinoGameStrategy implements GameScoreStrategy {

    private static final String GAME_SLUG = "dino-game";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public int calculateScore(ScoreDTO data) {
        log.info("Calculando score para Dino Game com data: {}", data);

        try {
            // Valor base é a distância percorrida
            int baseScore = data.getValue() != null ? data.getValue() : 0;

            // Se houver metadata, extrair bônus adicionais
            if (data.getMetadata() != null && !data.getMetadata().isEmpty()) {
                var metadata = objectMapper.readTree(data.getMetadata());

                // Bônus por inimigos derrotados
                int enemiesDefeated = metadata.has("enemies_defeated") 
                    ? metadata.get("enemies_defeated").asInt() 
                    : 0;
                int enemyBonus = enemiesDefeated * 10;

                // Multiplicador de nível
                int level = metadata.has("level") 
                    ? metadata.get("level").asInt() 
                    : 1;
                double levelMultiplier = Math.pow(1.2, level - 1);

                // Cálculo final
                int finalScore = (int) ((baseScore + enemyBonus) * levelMultiplier);
                
                log.info("Score calculado para Dino Game: base={}, enemyBonus={}, levelMultiplier={}, final={}",
                    baseScore, enemyBonus, levelMultiplier, finalScore);
                
                return finalScore;
            }

            log.info("Score calculado para Dino Game (sem metadata): {}", baseScore);
            return baseScore;

        } catch (Exception e) {
            log.error("Erro ao calcular score para Dino Game", e);
            return data.getValue() != null ? data.getValue() : 0;
        }
    }

    @Override
    public String getGameSlug() {
        return GAME_SLUG;
    }
}

