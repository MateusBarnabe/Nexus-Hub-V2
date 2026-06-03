package com.example.nexus.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuração de WebSocket para comunicação em tempo real no Nexus Score
 *
 * Responsabilidades:
 * - Habilitar o suporte a WebSocket com STOMP (Simple Text Oriented Messaging Protocol)
 * - Configurar os endpoints para conexão de clientes
 * - Definir os prefixos dos tópicos para mensagens
 * - Configurar o message broker para roteamento de mensagens
 *
 * Padrão: Configuration Pattern (Spring)
 * Princípios SOLID: Single Responsibility (SRP)
 *
 * Endpoints e Tópicos:
 * - STOMP Endpoint: /ws
 *   Clientes se conectam via: ws://localhost:8080/ws
 *
 * - Tópicos (Subscribe):
 *   - /topic/standings: Recebe atualizações de placar em tempo real
 *     O ScoreService envia mensagens para este tópico via SimpMessagingTemplate
 *
 * - App Prefix: /app
 *   Clientes enviam mensagens para "/app/*" (futuras implementações)
 *
 * @author Nexus Score Team
 * @version 1.0
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configura o message broker para roteamento de mensagens
     *
     * @param config Registro do message broker
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita o broker de memória simples (adequado para aplicações pequenas/médias)
        // Padrão: /topic para broadcast, /queue para unicast (ponto-a-ponto)
        config.enableSimpleBroker("/topic", "/queue");

        // Define o prefixo para mensagens de aplicação
        // Quando um cliente envia para /app/something, mapeia para @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");

        // Define o prefixo para respostas user-específicas (se usar /user)
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Registra o endpoint STOMP para conexão de clientes WebSocket
     *
     * @param registry Registro de endpoints STOMP
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint onde clientes se conectam
        registry.addEndpoint("/ws")
            .setAllowedOrigins("*")  // TODO: Configurar CORS adequadamente em produção
            .withSockJS();            // Fallback para navegadores que não suportam WebSocket

        // O cliente pode conectar via:
        // var socket = new SockJS('/ws');
        // var stompClient = Stomp.over(socket);
        // stompClient.connect({}, onConnected, onError);
    }
}

