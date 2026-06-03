package com.example.nexus.repository;

import com.example.nexus.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository para a entidade Game
 *
 * Responsabilidades:
 * - Fornecer operações CRUD para Game
 * - Implementar queries customizadas de acesso a dados
 * - Abstrair a implementação de persistência
 *
 * Padrão: Repository Pattern (Spring Data JPA)
 * Princípios SOLID:
 *   - Single Responsibility (SRP): Responsável apenas por acesso a dados
 *   - Dependency Inversion (DIP): Dependência em abstração (JpaRepository)
 *
 * @author Nexus Score Team
 * @version 1.0
 */
@Repository
public interface GameRepository extends JpaRepository<Game, Long> {

    /**
     * Busca um jogo pelo slug
     * Utilizado para identificar qual Strategy usar no cálculo de score
     *
     * @param slug Slug único do jogo (ex: "dino-game", "flappy-bird")
     * @return Optional contendo o jogo se encontrado
     */
    Optional<Game> findBySlug(String slug);

    /**
     * Busca todos os jogos de uma categoria
     *
     * @param category Categoria do jogo
     * @return Lista de jogos da categoria
     */
    Iterable<Game> findByCategory(String category);

    /**
     * Verifica se um jogo com o slug especificado existe
     *
     * @param slug Slug do jogo
     * @return true se o slug existe, false caso contrário
     */
    boolean existsBySlug(String slug);
}

