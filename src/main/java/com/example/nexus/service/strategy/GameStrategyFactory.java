package com.example.nexus.service.strategy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Factory para obter a Strategy correta baseada no slug do jogo
 *
 * Responsabilidades:
 * - Manter registro de todas as strategies disponíveis
 * - Resolver a strategy correta baseada no slug do jogo
 * - Lançar exceção se a strategy não for encontrada
 *
 * Padrão: Factory Pattern + Strategy Pattern
 * Princípios SOLID:
 *   - Single Responsibility (SRP): Responsável apenas por resolver strategies
 *   - Open/Closed (OCP): Fácil adicionar novas strategies sem modificar este código
 *
 * @author Nexus Score Team
 * @version 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GameStrategyFactory {

    /**
     * Lista de todas as strategies disponíveis
     * Spring injeta automaticamente todas as implementações de GameScoreStrategy
     */
    private final List<GameScoreStrategy> strategies;

    /**
     * Obtém a strategy correta para o slug do jogo fornecido
     *
     * @param gameSlug Slug único do jogo
     * @return Strategy correspondente ao jogo
     * @throws NoSuchElementException Se nenhuma strategy for encontrada para o slug
     */
    public GameScoreStrategy getStrategy(String gameSlug) {
        log.info("Procurando strategy para o jogo: {}", gameSlug);

        return strategies.stream()
            .filter(strategy -> strategy.getGameSlug().equals(gameSlug))
            .findFirst()
            .orElseThrow(() -> {
                log.error("Strategy não encontrada para o jogo: {}", gameSlug);
                return new NoSuchElementException(
                    String.format("Nenhuma strategy encontrada para o jogo: %s", gameSlug)
                );
            });
    }

    /**
     * Verifica se uma strategy existe para o slug fornecido
     *
     * @param gameSlug Slug único do jogo
     * @return true se a strategy existe, false caso contrário
     */
    public boolean hasStrategy(String gameSlug) {
        return strategies.stream()
            .anyMatch(strategy -> strategy.getGameSlug().equals(gameSlug));
    }

    /**
     * Obtém todos os slugs de jogos supportados
     *
     * @return Lista de slugs disponíveis
     */
    public List<String> getAvailableGameSlugs() {
        return strategies.stream()
            .map(GameScoreStrategy::getGameSlug)
            .toList();
    }
}

