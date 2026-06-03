package com.example.nexus.config;

import com.example.nexus.model.Game;
import com.example.nexus.model.Role;
import com.example.nexus.model.User;
import com.example.nexus.repository.GameRepository;
import com.example.nexus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Seeder para pré-configurar os jogos do Vercel e usuários padrão de teste no banco de dados.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("Executando Database Seeder para inicializar jogos e usuários...");

        // 1. Inicializar Jogos
        seedGame("duelo-galactico", "Duelo Galático", "Batalha espacial multiplayer clássica", 
                 "https://duelo-galactico.vercel.app/", "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=400", "action");

        seedGame("camp-jump", "Camp Jump", "Jogo de corrida de obstáculos e agilidade", 
                 "https://camp-jump.vercel.app/", "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400", "adventure");

        // 2. Inicializar Usuários de Teste (compatíveis com o DTO do login)
        seedUser("admin@example.com", "Administrador", "password1", Role.ADMIN);
        seedUser("user@example.com", "João Silva", "password1", Role.USER);
    }

    private void seedGame(String slug, String title, String description, String launchUrl, String imageUrl, String category) {
        Optional<Game> gameOpt = gameRepository.findBySlug(slug);
        if (gameOpt.isEmpty()) {
            Game game = Game.builder()
                    .slug(slug)
                    .title(title)
                    .description(description)
                    .category(category)
                    .launchUrl(launchUrl)
                    .imageUrl(imageUrl)
                    .embed(true)
                    .isActive(true)
                    .build();
            gameRepository.save(game);
            log.info("Jogo '{}' cadastrado com sucesso!", title);
        } else {
            // Garantir que a URL está atualizada mesmo se já existia o registro
            Game game = gameOpt.get();
            game.setLaunchUrl(launchUrl);
            game.setImageUrl(imageUrl);
            gameRepository.save(game);
            log.info("Jogo '{}' já existia. URLs atualizadas.", title);
        }
    }

    private void seedUser(String email, String name, String password, Role role) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .name(name)
                    .password(password) // usando a senha padrão solicitada
                    .role(role)
                    .build();
            userRepository.save(user);
            log.info("Usuário de teste '{}' ({}) cadastrado com sucesso!", name, role);
        }
    }
}
