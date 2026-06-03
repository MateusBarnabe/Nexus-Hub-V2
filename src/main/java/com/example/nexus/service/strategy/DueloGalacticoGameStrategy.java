package com.example.nexus.service.strategy;

import com.example.nexus.dto.ScoreDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Implementação da Strategy para cálculo de score do jogo "Duelo Galático"
 */
@Slf4j
@Component
public class DueloGalacticoGameStrategy implements GameScoreStrategy {

    private static final String GAME_SLUG = "duelo-galactico";

    @Override
    public int calculateScore(ScoreDTO data) {
        log.info("Calculando score para Duelo Galático: {}", data.getValue());
        return data.getValue() != null ? data.getValue() : 0;
    }

    @Override
    public String getGameSlug() {
        return GAME_SLUG;
    }
}
