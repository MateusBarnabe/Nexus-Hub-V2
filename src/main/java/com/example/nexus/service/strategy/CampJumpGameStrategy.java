package com.example.nexus.service.strategy;

import com.example.nexus.dto.ScoreDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Implementação da Strategy para cálculo de score do jogo "Camp Jump"
 */
@Slf4j
@Component
public class CampJumpGameStrategy implements GameScoreStrategy {

    private static final String GAME_SLUG = "camp-jump";

    @Override
    public int calculateScore(ScoreDTO data) {
        log.info("Calculando score para Camp Jump: {}", data.getValue());
        return data.getValue() != null ? data.getValue() : 0;
    }

    @Override
    public String getGameSlug() {
        return GAME_SLUG;
    }
}
