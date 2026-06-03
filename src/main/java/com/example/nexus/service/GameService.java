package com.example.nexus.service;

import com.example.nexus.dto.GameDTO;
import com.example.nexus.model.Game;
import com.example.nexus.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service para gerenciamento de Games
 * 
 * Responsabilidades:
 * - Operações CRUD para Games
 * - Validação de dados de entrada
 * - Conversão entre Game e GameDTO
 * - Busca e filtro de jogos
 * 
 * Padrão: Service Layer (Camada de Negócio)
 * Princípios SOLID: Single Responsibility (SRP)
 * 
 * @author Nexus Score Team
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GameService {

    private final GameRepository gameRepository;

    /**
     * Cria um novo jogo
     * 
     * @param gameDTO Dados do jogo
     * @return Jogo criado
     */
    public GameDTO createGame(GameDTO gameDTO) {
        log.info("Criando novo jogo: {}", gameDTO.getTitle());

        if (gameRepository.existsBySlug(gameDTO.getSlug())) {
            throw new RuntimeException("Jogo com slug já existe: " + gameDTO.getSlug());
        }

        Game game = Game.builder()
            .title(gameDTO.getTitle())
            .slug(gameDTO.getSlug())
            .category(gameDTO.getCategory() != null ? gameDTO.getCategory() : "arcade")
            .description(gameDTO.getDescription())
            .imageUrl(gameDTO.getImageUrl())
            .launchUrl(gameDTO.getConfig() != null ? gameDTO.getConfig().getLaunchUrl() : null)
            .embed(gameDTO.getConfig() != null && gameDTO.getConfig().getEmbed() != null ? gameDTO.getConfig().getEmbed() : true)
            .isActive(gameDTO.getIsActive() != null ? gameDTO.getIsActive() : true)
            .build();

        Game savedGame = gameRepository.save(game);
        log.info("Jogo criado com sucesso: id={}, slug={}", savedGame.getId(), savedGame.getSlug());

        return mapToDTO(savedGame);
    }

    /**
     * Obtém todos os jogos
     * 
     * @return Lista de todos os jogos
     */
    public List<GameDTO> getAllGames() {
        return gameRepository.findAll().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Obtém um jogo pelo ID
     * 
     * @param gameId Identificador do jogo
     * @return Jogo encontrado
     */
    public GameDTO getGameById(Long gameId) {
        Game game = gameRepository.findById(gameId)
            .orElseThrow(() -> new RuntimeException("Jogo não encontrado: " + gameId));
        return mapToDTO(game);
    }

    /**
     * Obtém um jogo pelo slug
     * 
     * @param slug Slug único do jogo
     * @return Jogo encontrado
     */
    public GameDTO getGameBySlug(String slug) {
        Game game = gameRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Jogo não encontrado: " + slug));
        return mapToDTO(game);
    }

    /**
     * Obtém jogos por categoria
     * 
     * @param category Categoria do jogo
     * @return Lista de jogos da categoria
     */
    public List<GameDTO> getGamesByCategory(String category) {
        return ((List<Game>) gameRepository.findByCategory(category)).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Atualiza um jogo existente
     * 
     * @param gameId Identificador do jogo
     * @param gameDTO Novos dados do jogo
     * @return Jogo atualizado
     */
    public GameDTO updateGame(Long gameId, GameDTO gameDTO) {
        log.info("Atualizando jogo: id={}", gameId);

        Game game = gameRepository.findById(gameId)
            .orElseThrow(() -> new RuntimeException("Jogo não encontrado: " + gameId));

        if (!game.getSlug().equals(gameDTO.getSlug()) && gameRepository.existsBySlug(gameDTO.getSlug())) {
            throw new RuntimeException("Slug já existe: " + gameDTO.getSlug());
        }

        game.setTitle(gameDTO.getTitle());
        game.setSlug(gameDTO.getSlug());
        if (gameDTO.getCategory() != null) {
            game.setCategory(gameDTO.getCategory());
        }
        game.setDescription(gameDTO.getDescription());
        game.setImageUrl(gameDTO.getImageUrl());
        if (gameDTO.getConfig() != null) {
            game.setLaunchUrl(gameDTO.getConfig().getLaunchUrl());
            if (gameDTO.getConfig().getEmbed() != null) {
                game.setEmbed(gameDTO.getConfig().getEmbed());
            }
        }
        if (gameDTO.getIsActive() != null) {
            game.setIsActive(gameDTO.getIsActive());
        }

        Game updatedGame = gameRepository.save(game);
        log.info("Jogo atualizado com sucesso: id={}", updatedGame.getId());

        return mapToDTO(updatedGame);
    }

    /**
     * Remove um jogo
     * 
     * @param gameId Identificador do jogo
     */
    public void deleteGame(Long gameId) {
        log.info("Deletando jogo: id={}", gameId);

        if (!gameRepository.existsById(gameId)) {
            throw new RuntimeException("Jogo não encontrado: " + gameId);
        }

        gameRepository.deleteById(gameId);
        log.info("Jogo deletado com sucesso: id={}", gameId);
    }

    /**
     * Converte uma entidade Game para GameDTO
     * 
     * @param game Entidade Game
     * @return GameDTO com dados do jogo
     */
    private GameDTO mapToDTO(Game game) {
        return GameDTO.builder()
            .id(game.getId())
            .title(game.getTitle())
            .slug(game.getSlug())
            .category(game.getCategory())
            .description(game.getDescription())
            .imageUrl(game.getImageUrl())
            .isActive(game.getIsActive())
            .config(GameDTO.Config.builder()
                .launchUrl(game.getLaunchUrl())
                .embed(game.getEmbed())
                .build())
            .createdAt(game.getCreatedAt().toString())
            .build();
    }
}

