# Nexus Score - Hub de Jogos com Placar em Tempo Real

## 📋 Visão Geral

Nexus Score é uma plataforma robusta de Hub de Jogos que utiliza **Spring Boot**, **PostgreSQL**, **RabbitMQ** e **WebSockets** para oferecer uma experiência de jogo interativa com placar em tempo real.

## 🏗️ Arquitetura

### Padrões Arquiteturais

- **Arquitetura em Camadas**: Controller → Service → Repository → Model
- **Strategy Pattern**: Para cálculo de scores específicos de cada jogo
- **Dependency Injection**: Via Spring Framework
- **Repository Pattern**: Para abstração de dados
- **DTO Pattern**: Para isolamento de dados nas APIs

### Princípios SOLID Aplicados

1. **Single Responsibility Principle (SRP)**
   - Cada classe tem uma única responsabilidade bem definida
   - Exemplo: `ScoreService` responsável apenas por lógica de scores

2. **Open/Closed Principle (OCP)**
   - Sistema aberto para extensão de novos jogos
   - Fechado para modificação através do Strategy Pattern
   - Adicionar novo jogo = criar nova Strategy, sem alterar código existente

3. **Liskov Substitution Principle (LSP)**
   - Qualquer implementação de `GameScoreStrategy` pode ser usada no lugar da interface

4. **Interface Segregation Principle (ISP)**
   - Interfaces mínimas e bem definidas
   - Exemplo: `GameScoreStrategy` possui apenas dois métodos necessários

5. **Dependency Inversion Principle (DIP)**
   - Código depende de abstrações, não de implementações concretas
   - Injeção de dependências via Spring

## 📦 Estrutura do Projeto

```
src/
├── main/
│   ├── java/com/example/nexus/
│   │   ├── controller/          # Camada de Apresentação (REST APIs)
│   │   │   ├── ScoreController.java
│   │   │   ├── GameController.java
│   │   │   └── UserController.java
│   │   │
│   │   ├── service/             # Camada de Negócio
│   │   │   ├── ScoreService.java      # @RabbitListener para consumir fila de scores
│   │   │   ├── GameService.java
│   │   │   ├── UserService.java
│   │   │   └── strategy/
│   │   │       ├── GameScoreStrategy.java      # Interface
│   │   │       ├── DinoGameStrategy.java       # Implementação
│   │   │       ├── FlappyBirdGameStrategy.java # Implementação
│   │   │       └── GameStrategyFactory.java    # Factory para resolver strategies
│   │   │
│   │   ├── repository/          # Camada de Acesso a Dados
│   │   │   ├── UserRepository.java
│   │   │   ├── GameRepository.java
│   │   │   └── ScoreRepository.java
│   │   │
│   │   ├── model/               # Entidades de Domínio
│   │   │   ├── User.java
│   │   │   ├── Game.java
│   │   │   ├── Score.java
│   │   │   └── Role.java
│   │   │
│   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── UserDTO.java
│   │   │   ├── GameDTO.java
│   │   │   ├── ScoreDTO.java
│   │   │   └── StandingsDTO.java
│   │   │
│   │   ├── config/              # Configurações
│   │   │   ├── RabbitMQConfig.java
│   │   │   └── WebSocketConfig.java
│   │   │
│   │   └── NexusApplication.java # Classe Principal
│   │
│   └── resources/
│       └── application.yml       # Configuração da aplicação
│
└── test/
    └── java/com/example/nexus/
        └── NexusApplicationTests.java
```

## 🎮 Entidades Principais

### User
- **id**: Identificador único
- **name**: Nome do usuário
- **email**: Email único
- **password**: Senha (salvar com hash em produção)
- **role**: ADMIN ou USER
- **createdAt/updatedAt**: Timestamps

### Game
- **id**: Identificador único
- **title**: Título do jogo
- **slug**: Identificador único em URL (ex: "dino-game")
- **category**: Categoria (ex: "arcade", "puzzle")
- **description**: Descrição do jogo
- **createdAt/updatedAt**: Timestamps

### Score
- **id**: Identificador único
- **value**: Valor da pontuação calculada
- **user**: Referência para o usuário
- **game**: Referência para o jogo
- **metadata**: JSON com dados específicos do jogo
- **createdAt**: Timestamp de registro

## 🎯 Strategy Pattern - Cálculo de Scores

### Fluxo

1. **Mensagem na Fila RabbitMQ**
   - DevFrontend envia: `{ userId: 1, gameSlug: "dino-game", value: 150, metadata: {...} }`

2. **ScoreService Consome (@RabbitListener)**
   - Recebe mensagem da fila `scores.queue`
   - Valida usuário e jogo
   - Obtém a Strategy correta via `GameStrategyFactory.getStrategy(gameSlug)`

3. **Strategy Calcula**
   - `DinoGameStrategy` ou `FlappyBirdGameStrategy` implementam o cálculo específico
   - Retorna o valor calculado

4. **Score é Persistido**
   - Salva no banco com o valor calculado

5. **WebSocket Notifica**
   - Envia atualização para `/topic/standings`
   - Todos os clientes conectados recebem em tempo real

### Implementações Existentes

#### DinoGameStrategy
- **Slug**: `dino-game`
- **Cálculo**:
  - Base: distância percorrida
  - Bônus: 10 pontos por inimigo derrotado
  - Multiplicador: 1.2^(nível-1)
  - **Exemplo**: 150 distância + (5 inimigos × 10) = 200, × 1.2 (nível 2) = 240 pontos

#### FlappyBirdGameStrategy
- **Slug**: `flappy-bird`
- **Cálculo**:
  - Base: tubos passados
  - Bônus: 5 pontos por ouro coletado
  - Bonus perfeito: 50 pontos se sem colisões
  - **Exemplo**: 30 tubos + (10 ouro × 5) + 50 (perfeito) = 130 pontos

## 🔄 RabbitMQ - Mensageria

### Configuração

- **Host**: `rabbitmq` (Docker)
- **Porta**: `5672`
- **Painel Admin**: `http://localhost:15672` (user: guest, pass: guest)

### Filas

#### scores.queue
- **Tipo**: Durable (persiste entre reinicializações)
- **Consumer**: `ScoreService.consumeScore()`
- **Payload**:
```json
{
  "userId": 1,
  "gameSlug": "dino-game",
  "value": 150,
  "metadata": "{\"distance\": 150, \"enemies_defeated\": 5, \"level\": 2}"
}
```

## 🔌 WebSocket - Comunicação em Tempo Real

### Configuração

- **Endpoint**: `ws://localhost:8080/ws`
- **Message Broker**: Simple Broker (em memória)
- **Prefixo de Aplicação**: `/app`

### Tópicos

#### /topic/standings
- **Direção**: Servidor → Cliente (broadcast)
- **Acionador**: Após um score ser registrado
- **Payload**:
```json
{
  "id": 1,
  "value": 240,
  "userId": 1,
  "userName": "João",
  "gameSlug": "dino-game",
  "gameTitle": "Dino Game",
  "metadata": "...",
  "createdAt": "2024-06-01T10:30:00"
}
```

## 🛢️ PostgreSQL - Banco de Dados

### Configuração

- **Host**: `db` (Docker)
- **Porta**: `5432`
- **Database**: `nexus_db`
- **User**: `admin`
- **Password**: `senha_forte`

### Tabelas

- `users`: Usuários do sistema
- `games`: Jogos disponíveis
- `scores`: Pontuações registradas

## 🚀 Como Executar

### Pré-requisitos

- Docker e Docker Compose instalados
- Java 17+
- Maven 3.8+

### Execução com Docker Compose

```bash
# Na raiz do projeto (onde está docker-compose.yml)
docker-compose up

# A aplicação será iniciada em http://localhost:8080
```

### Execução Local (sem Docker)

```bash
# 1. Iniciar PostgreSQL
docker run --name postgres-nexus -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=senha_forte \
  -e POSTGRES_DB=nexus_db -p 5432:5432 -d postgres:15

# 2. Iniciar RabbitMQ
docker run --name rabbitmq-nexus -p 5672:5672 -p 15672:15672 -d rabbitmq:3-management

# 3. Compilar e executar aplicação
mvn clean spring-boot:run
```

## 📡 API REST Endpoints

### Users

```
POST   /api/users                    # Criar usuário
GET    /api/users                    # Listar todos
GET    /api/users/{userId}           # Obter por ID
GET    /api/users/email/{email}      # Obter por email
PUT    /api/users/{userId}           # Atualizar
DELETE /api/users/{userId}           # Deletar
```

### Games

```
POST   /api/games                    # Criar jogo
GET    /api/games                    # Listar todos
GET    /api/games/{gameId}           # Obter por ID
GET    /api/games/slug/{slug}        # Obter por slug
GET    /api/games/category/{cat}     # Listar por categoria
PUT    /api/games/{gameId}           # Atualizar
DELETE /api/games/{gameId}           # Deletar
```

### Scores

```
GET    /api/scores/{scoreId}                    # Obter score
GET    /api/scores/user/{userId}                # Scores do usuário
GET    /api/scores/user/{userId}/game/{gameId}  # Scores em um jogo
GET    /api/scores/user/{userId}/game/{gameId}/max  # Maior score
```

## 📚 Adição de Novo Jogo

### 1. Criar Nova Strategy

```java
@Slf4j
@Component
public class MyGameStrategy implements GameScoreStrategy {

    private static final String GAME_SLUG = "my-game";

    @Override
    public int calculateScore(ScoreDTO data) {
        // Implementar lógica de cálculo
        return calculoFinal;
    }

    @Override
    public String getGameSlug() {
        return GAME_SLUG;
    }
}
```

### 2. Registrar Jogo no Banco

```bash
POST /api/games
{
  "title": "Meu Jogo",
  "slug": "my-game",
  "category": "arcade",
  "description": "Um jogo incrível"
}
```

### 3. Pronto!

A Strategy será automaticamente descoberta via `GameStrategyFactory` e injetada no `ScoreService`.

## 🧪 Testes

```bash
# Executar testes
mvn test

# Com cobertura
mvn jacoco:report
```

## 📊 Logging

Logs são configurados em `application.yml`:

- **root**: INFO
- **com.example.nexus**: DEBUG
- **RabbitMQ**: DEBUG
- **WebSocket**: DEBUG

Verificar logs em:
```bash
docker-compose logs -f app
```

## 📝 Dependências Principais

```xml
<!-- Spring Boot -->
<spring-boot-starter-web>
<spring-boot-starter-data-jpa>
<spring-boot-starter-amqp>
<spring-boot-starter-websocket>

<!-- Database -->
<postgresql>

<!-- Utilities -->
<lombok>
```

## 📄 Licença

Este projeto é parte do Projeto Integrador da Faculdade.

## 👥 Autor

Nexus Score Team

---

**Versão**: 2.0.1  
**Data**: 2024-06-01  
**Status**: Em Desenvolvimento

