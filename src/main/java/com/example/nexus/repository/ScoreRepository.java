package com.example.nexus.repository;

import com.example.nexus.model.Score;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository para a entidade Score
 *
 * Responsabilidades:
 * - Fornecer operações CRUD para Score
 * - Implementar queries customizadas para busca de pontuações
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
public interface ScoreRepository extends JpaRepository<Score, Long> {

    /**
     * Busca todos os scores de um usuário em um jogo específico
     *
     * @param userId Identificador do usuário
     * @param gameId Identificador do jogo
     * @return Lista de scores do usuário no jogo
     */
    List<Score> findByUserIdAndGameId(Long userId, Long gameId);

    /**
     * Busca o score mais alto de um usuário em um jogo
     *
     * @param userId Identificador do usuário
     * @param gameId Identificador do jogo
     * @return Maior score do usuário naquele jogo
     */
    @Query("SELECT MAX(s.value) FROM Score s WHERE s.user.id = :userId AND s.game.id = :gameId")
    Integer findMaxScoreByUserAndGame(@Param("userId") Long userId, @Param("gameId") Long gameId);

    /**
     * Busca o ranking (top scores) de um jogo com paginação
     *
     * @param gameId Identificador do jogo
     * @param pageable Configuração de paginação (ex: TOP 10)
     * @return Página com os melhores scores do jogo
     */
    @Query("SELECT s FROM Score s WHERE s.game.id = :gameId ORDER BY s.value DESC")
    Page<Score> findTopScoresByGame(@Param("gameId") Long gameId, Pageable pageable);

    /**
     * Busca todos os scores de um usuário específico
     *
     * @param userId Identificador do usuário
     * @return Lista de todos os scores do usuário
     */
    List<Score> findByUserId(Long userId);

    /**
     * Busca todos os scores de um jogo específico
     *
     * @param gameId Identificador do jogo
     * @return Lista de todos os scores do jogo
     */
    List<Score> findByGameId(Long gameId);

    /**
     * Consulta nativa para retornar o ranking agrupado por usuário e ordenado por soma total de scores.
     */
    @Query(value = "SELECT u.id, u.name, u.email, SUM(s.value) as totalScore, COUNT(s.id) as entries " +
                   "FROM scores s " +
                   "JOIN users u ON s.user_id = u.id " +
                   "WHERE (:gameId IS NULL OR s.game_id = :gameId) " +
                   "AND (cast(:startDate as timestamp) IS NULL OR s.created_at >= :startDate) " +
                   "GROUP BY u.id, u.name, u.email " +
                   "ORDER BY totalScore DESC", nativeQuery = true)
    List<Object[]> getLeaderboardRaw(@Param("gameId") Long gameId, @Param("startDate") java.time.LocalDateTime startDate);
}

