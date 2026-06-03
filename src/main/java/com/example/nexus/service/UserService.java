package com.example.nexus.service;

import com.example.nexus.dto.UserDTO;
import com.example.nexus.model.Role;
import com.example.nexus.model.User;
import com.example.nexus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service para gerenciamento de Users
 *
 * Responsabilidades:
 * - Operações CRUD para Users
 * - Validação de dados de entrada
 * - Conversão entre User e UserDTO
 * - Busca de usuários
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
public class UserService {

    private final UserRepository userRepository;

    /**
     * Cria um novo usuário
     *
     * @param userDTO Dados do usuário
     * @return Usuário criado
     */
    public UserDTO createUser(UserDTO userDTO) {
        log.info("Criando novo usuário: {}", userDTO.getEmail());

        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email já existe: " + userDTO.getEmail());
        }

        User user = User.builder()
            .name(userDTO.getName())
            .email(userDTO.getEmail())
            .password(userDTO.getName()) // TODO: Implementar hash de senha com BCrypt
            .role(userDTO.getRole() != null ? userDTO.getRole() : Role.USER)
            .build();

        User savedUser = userRepository.save(user);
        log.info("Usuário criado com sucesso: id={}, email={}", savedUser.getId(), savedUser.getEmail());

        return mapToDTO(savedUser);
    }

    /**
     * Obtém todos os usuários
     *
     * @return Lista de todos os usuários
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Obtém um usuário pelo ID
     *
     * @param userId Identificador do usuário
     * @return Usuário encontrado
     */
    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + userId));
        return mapToDTO(user);
    }

    /**
     * Obtém um usuário pelo email
     *
     * @param email Email do usuário
     * @return Usuário encontrado
     */
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + email));
        return mapToDTO(user);
    }

    /**
     * Atualiza um usuário existente
     *
     * @param userId Identificador do usuário
     * @param userDTO Novos dados do usuário
     * @return Usuário atualizado
     */
    public UserDTO updateUser(Long userId, UserDTO userDTO) {
        log.info("Atualizando usuário: id={}", userId);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + userId));

        if (!user.getEmail().equals(userDTO.getEmail()) && userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email já existe: " + userDTO.getEmail());
        }

        user.setName(userDTO.getName());
        user.setEmail(userDTO.getEmail());
        if (userDTO.getRole() != null) {
            user.setRole(userDTO.getRole());
        }

        User updatedUser = userRepository.save(user);
        log.info("Usuário atualizado com sucesso: id={}", updatedUser.getId());

        return mapToDTO(updatedUser);
    }

    /**
     * Remove um usuário
     *
     * @param userId Identificador do usuário
     */
    public void deleteUser(Long userId) {
        log.info("Deletando usuário: id={}", userId);

        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("Usuário não encontrado: " + userId);
        }

        userRepository.deleteById(userId);
        log.info("Usuário deletado com sucesso: id={}", userId);
    }

    /**
     * Converte uma entidade User para UserDTO
     *
     * @param user Entidade User
     * @return UserDTO com dados do usuário
     */
    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole())
            .createdAt(user.getCreatedAt().toString())
            .build();
    }
}

