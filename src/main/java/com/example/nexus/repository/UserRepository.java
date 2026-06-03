package com.example.nexus.repository;

import com.example.nexus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository para a entidade User
 * 
 * Responsabilidades:
 * - Fornecer operações CRUD para User
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
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Busca um usuário pelo email
     * 
     * @param email Email do usuário
     * @return Optional contendo o usuário se encontrado
     */
    Optional<User> findByEmail(String email);

    /**
     * Verifica se um usuário com o email especificado existe
     * 
     * @param email Email do usuário
     * @return true se o email existe, false caso contrário
     */
    boolean existsByEmail(String email);
}

