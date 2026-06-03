package com.example.nexus.model;

/**
 * Enum que representa os papéis (roles) de usuário no sistema.
 * Aplicando o princípio de separação de responsabilidades, mantendo a definição
 * de papéis de forma centralizada e reutilizável.
 *
 * Padrão: Type-Safe Enum
 * Princípios SOLID: Single Responsibility (SRP)
 *
 * @author Nexus Score Team
 * @version 1.0
 */
public enum Role {
    /**
     * Papel de administrador - possui acesso total ao sistema
     */
    ADMIN("Administrador"),

    /**
     * Papel de usuário comum - acesso restrito às funcionalidades básicas
     */
    USER("Usuário");

    private final String description;

    Role(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

