package com.example.nexus.service;

import com.example.nexus.dto.ScoreDTO;
import com.example.nexus.model.Game;
import com.example.nexus.model.Score;
import com.example.nexus.model.User;
import com.example.nexus.repository.GameRepository;
import com.example.nexus.repository.ScoreRepository;
import com.example.nexus.repository.UserRepository;
import com.example.nexus.service.strategy.GameStrategyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service para gerenciamento de Scores
 * 
 * Responsabilidades:
 * - Consumir mensagens de scores da fila RabbitMQ
 * - Utilizar Strategy Pattern para calcular pontuações específicas de cada jogo
 * - Persistir scores no banco de dados
 * - Enviar atualizações em tempo real via WebSocket
 * - Fornecer operações CRUD de scores
 * 
 * Padrão: 
 *   - Service Layer (Camada de Negócio)
 *   - Consumer Pattern (RabbitMQ)
 *   - Dependency Injection
 * 
 * Princípios SOLID:
 *   - Single Responsibility (SRP): Responsável apenas por lógica de score
 *   - Open/Closed (OCP): Novas estratégias podem ser adicionadas sem modificação
 *   - Liskov Substitution (LSP): Qualquer strategy pode ser usada
 *   - Interface Segregation (ISP): Depende de interfaces bem definidas
 *   - Dependency Inversion (DIP): Depende de abstrações (Repository, Strategy)
 * 
 * @author Nexus Score Team
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final GameStrategyFactory strategyFactory;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String SCORES_QUEUE = "scores.queue";
    private static final String STANDINGS_TOPIC = "/topic/standings";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Listener que consome mensagens da fila RabbitMQ 'scores.queue'
     * 
     * Fluxo:
     * 1. Recebe mensagem com dados do score
     * 2. Valida se usuário e jogo existem
     * 3. Obtém a Strategy correta baseada no gameSlug
     * 4. Calcula o score usando a strategy
     * 5. Persiste no banco de dados
     * 6. Envia atualização via WebSocket para '/topic/standings'
     * 
     * @param scoreDTO Dados do score recebidos da fila
     */
    @RabbitListener(queues = SCORES_QUEUE)
    public void consumeScore(ScoreDTO scoreDTO) {
        log.info("Mensagem recebida na fila {}: {}", SCORES_QUEUE, scoreDTO);

        try {
            // 1. Validar dados básicos
            if (scoreDTO.getUserId() == null || scoreDTO.getGameSlug() == null) {
                log.error("Dados incompletos: userId={}, gameSlug={}", 
                    scoreDTO.getUserId(), scoreDTO.getGameSlug());
                return;
            }

            // 2. Buscar usuário e jogo do banco
            User user = userRepository.findById(scoreDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + scoreDTO.getUserId()));

            Game game = gameRepository.findBySlug(scoreDTO.getGameSlug())
                .orElseThrow(() -> new RuntimeException("Jogo não encontrado: " + scoreDTO.getGameSlug()));

            // 3. Obter a strategy correta para este jogo
            var strategy = strategyFactory.getStrategy(scoreDTO.getGameSlug());

            // 4. Calcular o score usando a strategy
            int calculatedScore = strategy.calculateScore(scoreDTO);
            log.info("Score calculado: {} para usuário: {}, jogo: {}", 
                calculatedScore, user.getId(), game.getSlug());

            // 5. Criar e persistir o score
            Score score = Score.builder()
                .value(calculatedScore)
                .user(user)
                .game(game)
                .metadata(scoreDTO.getMetadata())
                .build();

            Score savedScore = scoreRepository.save(score);
            log.info("Score salvo com sucesso: id={}, value={}", savedScore.getId(), savedScore.getValue());

            // 6. Notificar via WebSocket
            notifyStandingsUpdate(savedScore);

        } catch (Exception e) {
            log.error("Erro ao processar score da fila", e);
        }
    }

    /**
     * Envia atualização de standings via WebSocket para todos os clientes conectados
     * 
     * @param score Score que foi registrado
     */
    private void notifyStandingsUpdate(Score score) {
        try {
            ScoreDTO responseDTO = ScoreDTO.builder()
                .id(score.getId())
                .value(score.getValue())
                .userId(score.getUser().getId())
                .userName(score.getUser().getName())
                .gameSlug(score.getGame().getSlug())
                .gameTitle(score.getGame().getTitle())
                .metadata(score.getMetadata())
                .createdAt(score.getCreatedAt().format(DATE_FORMATTER))
                .build();

            messagingTemplate.convertAndSend(STANDINGS_TOPIC, responseDTO);
            log.info("Atualização de standings enviada via WebSocket: {}", responseDTO.getId());
        } catch (Exception e) {
            log.error("Erro ao enviar atualização de standings via WebSocket", e);
        }
    }

    /**
     * Obtém todos os scores de um usuário em um jogo específico
     * 
     * @param userId Identificador do usuário
     * @param gameId Identificador do jogo
     * @return Lista de scores do usuário no jogo
     */
    public List<Score> getScoresByUserAndGame(Long userId, Long gameId) {
        return scoreRepository.findByUserIdAndGameId(userId, gameId);
    }

    /**
     * Obtém o maior score de um usuário em um jogo
     * 
     * @param userId Identificador do usuário
     * @param gameId Identificador do jogo
     * @return Maior score do usuário naquele jogo
     */
    public Integer getMaxScoreByUserAndGame(Long userId, Long gameId) {
        return scoreRepository.findMaxScoreByUserAndGame(userId, gameId);
    }

    /**
     * Obtém todos os scores de um usuário
     * 
     * @param userId Identificador do usuário
     * @return Lista de todos os scores do usuário
     */
    public List<Score> getScoresByUser(Long userId) {
        return scoreRepository.findByUserId(userId);
    }

    /**
     * Obtém um score específico pelo ID
     * 
     * @param scoreId Identificador do score
     * @return Score encontrado
     */
    /**
     * Obtém um score específico pelo ID
     * 
     * @param scoreId Identificador do score
     * @return Score encontrado
     */
    public Score getScoreById(Long scoreId) {
        return scoreRepository.findById(scoreId)
            .orElseThrow(() -> new RuntimeException("Score não encontrado: " + scoreId));
    }

    /**
     * Converte a entidade Score para ScoreDTO.
     */
    public ScoreDTO mapToDTO(Score score) {
        return ScoreDTO.builder()
            .id(score.getId())
            .value(score.getValue())
            .userId(score.getUser().getId())
            .userName(score.getUser().getName())
            .gameSlug(score.getGame().getSlug())
            .gameTitle(score.getGame().getTitle())
            .metadata(score.getMetadata())
            .createdAt(score.getCreatedAt().format(DATE_FORMATTER))
            .build();
    }

    /**
     * Cria e processa um score enviado via REST API.
     */
    public ScoreDTO createScore(ScoreDTO scoreDTO) {
        if (scoreDTO.getUserId() == null || scoreDTO.getGameSlug() == null) {
            throw new RuntimeException("Dados incompletos: userId ou gameSlug ausente");
        }

        User user = userRepository.findById(scoreDTO.getUserId())
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + scoreDTO.getUserId()));

        Game game = gameRepository.findBySlug(scoreDTO.getGameSlug())
            .orElseThrow(() -> new RuntimeException("Jogo não encontrado: " + scoreDTO.getGameSlug()));

        var strategy = strategyFactory.getStrategy(scoreDTO.getGameSlug());
        int calculatedScore = strategy.calculateScore(scoreDTO);

        Score score = Score.builder()
            .value(calculatedScore)
            .user(user)
            .game(game)
            .metadata(scoreDTO.getMetadata())
            .build();

        Score savedScore = scoreRepository.save(score);
        log.info("Score salvo via HTTP: id={}, value={}", savedScore.getId(), savedScore.getValue());

        notifyStandingsUpdate(savedScore);

        return mapToDTO(savedScore);
    }

    /**
     * Retorna o ranking/leaderboard de acordo com os filtros solicitados.
     */
    public com.example.nexus.dto.LeaderboardResponseDTO getLeaderboard(String period, Long gameId, int limit, int page) {
        java.time.LocalDateTime startDate = null;
        java.time.LocalDate today = java.time.LocalDate.now();
        if ("day".equalsIgnoreCase(period)) {
            startDate = today.atStartOfDay();
        } else if ("week".equalsIgnoreCase(period)) {
            java.time.LocalDate monday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
            startDate = monday.atStartOfDay();
        }

        List<Object[]> rawList = scoreRepository.getLeaderboardRaw(gameId, startDate);
        
        java.util.List<com.example.nexus.dto.LeaderboardEntryDTO> entries = new java.util.ArrayList<>();
        int rank = 1;
        
        int skip = (page - 1) * limit;
        if (skip < 0) skip = 0;
        int limitEnd = Math.min(skip + limit, rawList.size());
        
        for (int i = skip; i < limitEnd; i++) {
            Object[] row = rawList.get(i);
            Long userId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String email = (String) row[2];
            int totalScore = ((Number) row[3]).intValue();
            int scoreCount = ((Number) row[4]).intValue();
            
            entries.add(com.example.nexus.dto.LeaderboardEntryDTO.builder()
                .rank(rank++)
                .totalScore(totalScore)
                .entries(scoreCount)
                .user(com.example.nexus.dto.LeaderboardEntryDTO.UserResponseDTO.builder()
                    .id(userId)
                    .name(name)
                    .email(email)
                    .build())
                .build());
        }
        
        int totalResults = rawList.size();
        int totalPages = (int) Math.ceil((double) totalResults / limit);
        
        return com.example.nexus.dto.LeaderboardResponseDTO.builder()
            .results(entries)
            .period(period)
            .gameId(gameId)
            .page(page)
            .limit(limit)
            .totalPages(totalPages)
            .totalResults(totalResults)
            .build();
    }
}

