package com.example.nexus.controller;

import com.example.nexus.dto.UserDTO;
import com.example.nexus.service.UserService;
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
 * Controller REST para gerenciamento de Users
 *
 * Responsabilidades:
 * - Expor endpoints REST para operações com usuários
 * - Validar requisições e mapear para o serviço
 * - Retornar respostas HTTP apropriadas
 *
 * Padrão: RESTful API Controller (Camada Presentation)
 * Princípios SOLID: Single Responsibility (SRP)
 *
 * Endpoints:
 * - POST /api/users: Criar novo usuário
 * - GET /api/users: Listar todos os usuários
 * - GET /api/users/{userId}: Obter usuário específico
 * - GET /api/users/email/{email}: Obter usuário por email
 * - PUT /api/users/{userId}: Atualizar usuário
 * - DELETE /api/users/{userId}: Deletar usuário
 *
 * @author Nexus Score Team
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Operacoes de gerenciamento de usuarios")
public class UserController {

    private final UserService userService;

    /**
     * Cria um novo usuário
     *
     * @param userDTO Dados do novo usuário
     * @return Usuário criado
     */
    @PostMapping
    @Operation(summary = "Criar usuario", description = "Cria um novo usuario no sistema")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Usuario criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invalidos")
    })
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        log.info("POST /api/users: Criando novo usuário '{}'", userDTO.getEmail());
        try {
            UserDTO createdUser = userService.createUser(userDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (RuntimeException e) {
            log.error("Erro ao criar usuário: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtém todos os usuários
     *
     * @return Lista de todos os usuários
     */
    @GetMapping
    @Operation(summary = "Listar usuarios", description = "Retorna todos os usuarios cadastrados")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
        @ApiResponse(responseCode = "500", description = "Erro interno")
    })
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        log.info("GET /api/users: Listando todos os usuários");
        try {
            List<UserDTO> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (RuntimeException e) {
            log.error("Erro ao listar usuários: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Obtém um usuário pelo ID
     *
     * @param userId Identificador do usuário
     * @return Usuário encontrado
     */
    @GetMapping("/{userId}")
    @Operation(summary = "Buscar usuario por ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Usuario encontrado"),
        @ApiResponse(responseCode = "404", description = "Usuario nao encontrado")
    })
    public ResponseEntity<UserDTO> getUserById(@Parameter(description = "ID do usuario") @PathVariable Long userId) {
        log.info("GET /api/users/{}: Obtendo usuário {}", userId, userId);
        try {
            UserDTO user = userService.getUserById(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("Erro ao obter usuário: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtém um usuário pelo email
     *
     * @param email Email do usuário
     * @return Usuário encontrado
     */
    @GetMapping("/email/{email}")
    @Operation(summary = "Buscar usuario por email")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Usuario encontrado"),
        @ApiResponse(responseCode = "404", description = "Usuario nao encontrado")
    })
    public ResponseEntity<UserDTO> getUserByEmail(@Parameter(description = "Email do usuario") @PathVariable String email) {
        log.info("GET /api/users/email/{}: Obtendo usuário", email);
        try {
            UserDTO user = userService.getUserByEmail(email);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("Erro ao obter usuário: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Atualiza um usuário existente
     *
     * @param userId Identificador do usuário
     * @param userDTO Novos dados do usuário
     * @return Usuário atualizado
     */
    @PutMapping("/{userId}")
    @Operation(summary = "Atualizar usuario")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Usuario atualizado"),
        @ApiResponse(responseCode = "400", description = "Dados invalidos")
    })
    public ResponseEntity<UserDTO> updateUser(
            @Parameter(description = "ID do usuario") @PathVariable Long userId,
            @RequestBody UserDTO userDTO) {
        log.info("PUT /api/users/{}: Atualizando usuário", userId);
        try {
            UserDTO updatedUser = userService.updateUser(userId, userDTO);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            log.error("Erro ao atualizar usuário: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Deleta um usuário
     *
     * @param userId Identificador do usuário
     * @return Status da operação
     */
    @DeleteMapping("/{userId}")
    @Operation(summary = "Remover usuario")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Usuario removido"),
        @ApiResponse(responseCode = "404", description = "Usuario nao encontrado")
    })
    public ResponseEntity<Void> deleteUser(@Parameter(description = "ID do usuario") @PathVariable Long userId) {
        log.info("DELETE /api/users/{}: Deletando usuário", userId);
        try {
            userService.deleteUser(userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Erro ao deletar usuário: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}

