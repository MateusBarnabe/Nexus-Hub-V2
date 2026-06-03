package com.example.nexus.dto;

import com.example.nexus.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object para transferência de dados de User
 * 
 * Responsabilidades:
 * - Transportar dados de usuário na API
 * - Evitar exposição da senha em respostas
 * - Isolar a entidade User das requisições HTTP
 * 
 * Padrão: Data Transfer Object (DTO)
 * Princípios SOLID: Interface Segregation (ISP)
 * 
 * @author Nexus Score Team
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {

    /**
     * Identificador único do usuário
     */
    private Long id;

    /**
     * Nome do usuário
     */
    private String name;

    /**
     * Email do usuário
     */
    private String email;

    /**
     * Papel/Role do usuário
     */
    private Role role;

    /**
     * Timestamp de criação (preenchido apenas em respostas)
     */
    private String createdAt;
}

