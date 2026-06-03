package com.example.nexus.controller;

import com.example.nexus.dto.ScoreDTO;
import com.example.nexus.service.ScoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller REST para gerenciamento de Scores
 * 
 * Responsabilidades:
 * - Expor endpoints REST para operações com scores
 * - Validar requisições e mapear para o serviço
 * - Retornar respostas HTTP apropriadas
 * 
 * Padrão: RESTful API Controller (Camada Presentation)
 * Princípios SOLID: Single Responsibility (SRP)
 * 
 * Endpoints:
 * - GET /api/scores/{scoreId}: Obter um score específico
 * - GET /api/scores/user/{userId}: Obter todos os scores de um usuário
 * - GET /api/scores/user/{userId}/game/{gameId}: Obter scores de um usuário em um jogo
 * - GET /api/scores/user/{userId}/game/{gameId}/max: Obter maior score
 * 
 * @author Nexus Score Team
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;

    /**
     * Cadastra um novo score via HTTP REST API.
     */
    @PostMapping
    public ResponseEntity<ScoreDTO> createScore(@RequestBody ScoreDTO scoreDTO) {
        log.info("POST /api/scores: Cadastrando score");
        try {
            ScoreDTO created = scoreService.createScore(scoreDTO);
            return ResponseEntity.status(201).body(created);
        } catch (RuntimeException e) {
            log.error("Erro ao cadastrar score: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Retorna o ranking/leaderboard consolidado de acordo com os filtros de periodo e jogo.
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<com.example.nexus.dto.LeaderboardResponseDTO> getLeaderboard(
            @RequestParam(required = false, defaultValue = "all") String period,
            @RequestParam(required = false) Long gameId,
            @RequestParam(required = false, defaultValue = "10") int limit,
            @RequestParam(required = false, defaultValue = "1") int page) {
        log.info("GET /api/scores/leaderboard: period={}, gameId={}", period, gameId);
        try {
            var leaderboard = scoreService.getLeaderboard(period, gameId, limit, page);
            return ResponseEntity.ok(leaderboard);
        } catch (RuntimeException e) {
            log.error("Erro ao obter leaderboard: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Obtém um score específico pelo ID
     * 
     * @param scoreId Identificador do score
     * @return Score encontrado
     */
    @GetMapping("/{scoreId}")
    public ResponseEntity<ScoreDTO> getScoreById(@PathVariable Long scoreId) {
        log.info("GET /api/scores/{}: Obtendo score {}", scoreId, scoreId);
        try {
            var score = scoreService.getScoreById(scoreId);
            return ResponseEntity.ok(scoreService.mapToDTO(score));
        } catch (RuntimeException e) {
            log.error("Erro ao obter score: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtém todos os scores de um usuário
     * 
     * @param userId Identificador do usuário
     * @return Lista de scores do usuário
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ScoreDTO>> getScoresByUser(@PathVariable Long userId) {
        log.info("GET /api/scores/user/{}: Obtendo scores do usuário {}", userId, userId);
        try {
            var scores = scoreService.getScoresByUser(userId);
            List<ScoreDTO> dtos = scores.stream()
                .map(scoreService::mapToDTO)
                .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (RuntimeException e) {
            log.error("Erro ao obter scores: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtém todos os scores de um usuário em um jogo específico
     * 
     * @param userId Identificador do usuário
     * @param gameId Identificador do jogo
     * @return Lista de scores do usuário no jogo
     */
    @GetMapping("/user/{userId}/game/{gameId}")
    public ResponseEntity<List<ScoreDTO>> getScoresByUserAndGame(
            @PathVariable Long userId,
            @PathVariable Long gameId) {
        log.info("GET /api/scores/user/{}/game/{}: Obtendo scores", userId, gameId);
        try {
            var scores = scoreService.getScoresByUserAndGame(userId, gameId);
            List<ScoreDTO> dtos = scores.stream()
                .map(scoreService::mapToDTO)
                .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (RuntimeException e) {
            log.error("Erro ao obter scores: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtém o maior score de um usuário em um jogo
     * 
     * @param userId Identificador do usuário
     * @param gameId Identificador do jogo
     * @return Maior score encontrado
     */
    @GetMapping("/user/{userId}/game/{gameId}/max")
    public ResponseEntity<Integer> getMaxScoreByUserAndGame(
            @PathVariable Long userId,
            @PathVariable Long gameId) {
        log.info("GET /api/scores/user/{}/game/{}/max: Obtendo maior score", userId, gameId);
        try {
            Integer maxScore = scoreService.getMaxScoreByUserAndGame(userId, gameId);
            if (maxScore != null) {
                return ResponseEntity.ok(maxScore);
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            log.error("Erro ao obter maior score: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}

