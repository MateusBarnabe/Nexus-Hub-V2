package com.example.nexus.controller;

import com.example.nexus.dto.GameDTO;
import com.example.nexus.service.GameService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para gerenciamento de Games
 * 
 * Responsabilidades:
 * - Expor endpoints REST para operações com games
 * - Validar requisições e mapear para o serviço
 * - Retornar respostas HTTP apropriadas
 * 
 * Padrão: RESTful API Controller (Camada Presentation)
 * Princípios SOLID: Single Responsibility (SRP)
 * 
 * Endpoints:
 * - POST /api/games: Criar novo jogo
 * - GET /api/games: Listar todos os jogos
 * - GET /api/games/{gameId}: Obter jogo específico
 * - GET /api/games/slug/{slug}: Obter jogo por slug
 * - GET /api/games/category/{category}: Listar jogos por categoria
 * - PUT /api/games/{gameId}: Atualizar jogo
 * - DELETE /api/games/{gameId}: Deletar jogo
 * 
 * @author Nexus Score Team
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
@Tag(name = "Games", description = "Operacoes de gerenciamento de jogos")
public class GameController {

    private final GameService gameService;

    /**
     * Cria um novo jogo
     * 
     * @param gameDTO Dados do novo jogo
     * @return Jogo criado
     */
    @PostMapping
    @Operation(summary = "Criar jogo")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Jogo criado"),
        @ApiResponse(responseCode = "400", description = "Dados invalidos")
    })
    public ResponseEntity<GameDTO> createGame(@RequestBody GameDTO gameDTO) {
        log.info("POST /api/games: Criando novo jogo '{}'", gameDTO.getTitle());
        try {
            GameDTO createdGame = gameService.createGame(gameDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdGame);
        } catch (RuntimeException e) {
            log.error("Erro ao criar jogo: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtém todos os jogos
     * 
     * @return Lista de todos os jogos
     */
    @GetMapping
    @Operation(summary = "Listar jogos")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
        @ApiResponse(responseCode = "500", description = "Erro interno")
    })
    public ResponseEntity<List<GameDTO>> getAllGames() {
        log.info("GET /api/games: Listando todos os jogos");
        try {
            List<GameDTO> games = gameService.getAllGames();
            return ResponseEntity.ok(games);
        } catch (RuntimeException e) {
            log.error("Erro ao listar jogos: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Obtém um jogo pelo ID
     * 
     * @param gameId Identificador do jogo
     * @return Jogo encontrado
     */
    @GetMapping("/{gameId}")
    @Operation(summary = "Buscar jogo por ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Jogo encontrado"),
        @ApiResponse(responseCode = "404", description = "Jogo nao encontrado")
    })
    public ResponseEntity<GameDTO> getGameById(@Parameter(description = "ID do jogo") @PathVariable Long gameId) {
        log.info("GET /api/games/{}: Obtendo jogo {}", gameId, gameId);
        try {
            GameDTO game = gameService.getGameById(gameId);
            return ResponseEntity.ok(game);
        } catch (RuntimeException e) {
            log.error("Erro ao obter jogo: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtém um jogo pelo slug
     * 
     * @param slug Slug único do jogo
     * @return Jogo encontrado
     */
    @GetMapping("/slug/{slug}")
    @Operation(summary = "Buscar jogo por slug")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Jogo encontrado"),
        @ApiResponse(responseCode = "404", description = "Jogo nao encontrado")
    })
    public ResponseEntity<GameDTO> getGameBySlug(@Parameter(description = "Slug do jogo") @PathVariable String slug) {
        log.info("GET /api/games/slug/{}: Obtendo jogo", slug);
        try {
            GameDTO game = gameService.getGameBySlug(slug);
            return ResponseEntity.ok(game);
        } catch (RuntimeException e) {
            log.error("Erro ao obter jogo: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtém jogos por categoria
     * 
     * @param category Categoria do jogo
     * @return Lista de jogos da categoria
     */
    @GetMapping("/category/{category}")
    @Operation(summary = "Listar jogos por categoria")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
        @ApiResponse(responseCode = "500", description = "Erro interno")
    })
    public ResponseEntity<List<GameDTO>> getGamesByCategory(@Parameter(description = "Categoria") @PathVariable String category) {
        log.info("GET /api/games/category/{}: Listando jogos da categoria", category);
        try {
            List<GameDTO> games = gameService.getGamesByCategory(category);
            return ResponseEntity.ok(games);
        } catch (RuntimeException e) {
            log.error("Erro ao listar jogos: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Atualiza um jogo existente
     * 
     * @param gameId Identificador do jogo
     * @param gameDTO Novos dados do jogo
     * @return Jogo atualizado
     */
    @PutMapping("/{gameId}")
    @Operation(summary = "Atualizar jogo")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Jogo atualizado"),
        @ApiResponse(responseCode = "400", description = "Dados invalidos")
    })
    public ResponseEntity<GameDTO> updateGame(
            @Parameter(description = "ID do jogo") @PathVariable Long gameId,
            @RequestBody GameDTO gameDTO) {
        log.info("PUT /api/games/{}: Atualizando jogo", gameId);
        try {
            GameDTO updatedGame = gameService.updateGame(gameId, gameDTO);
            return ResponseEntity.ok(updatedGame);
        } catch (RuntimeException e) {
            log.error("Erro ao atualizar jogo: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Deleta um jogo
     * 
     * @param gameId Identificador do jogo
     * @return Status da operação
     */
    @DeleteMapping("/{gameId}")
    @Operation(summary = "Remover jogo")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Jogo removido"),
        @ApiResponse(responseCode = "404", description = "Jogo nao encontrado")
    })
    public ResponseEntity<Void> deleteGame(@Parameter(description = "ID do jogo") @PathVariable Long gameId) {
        log.info("DELETE /api/games/{}: Deletando jogo", gameId);
        try {
            gameService.deleteGame(gameId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Erro ao deletar jogo: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}

