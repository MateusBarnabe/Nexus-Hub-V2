package com.example.nexus.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração do RabbitMQ para o projeto Nexus Score
 * 
 * Responsabilidades:
 * - Definir as filas de mensagem utilizadas no sistema
 * - Configurar os exchanges se necessário
 * - Estabelecer ligações entre exchanges e filas
 * 
 * Padrão: Configuration Pattern (Spring)
 * Princípios SOLID: Single Responsibility (SRP)
 * 
 * Filas Definidas:
 * - scores.queue: Fila para registrar novos scores de jogos
 *   O ScoreService contém um listener (@RabbitListener) que consome mensagens dessa fila
 *   e processa o cálculo e persistência do score.
 * 
 * @author Nexus Score Team
 * @version 1.0
 */
@Configuration
public class RabbitMQConfig {

    /**
     * Nome da fila de scores
     */
    public static final String SCORES_QUEUE = "scores.queue";

    /**
     * Define a fila 'scores.queue' para receber mensagens de scores
     * Esta fila será consumida pelo método @RabbitListener em ScoreService
     * 
     * @return Queue configurada com durabilidade
     */
    @Bean
    public Queue scoresQueue() {
        return new Queue(SCORES_QUEUE, true); // true = durable (persiste em reinicializações)
    }
}

