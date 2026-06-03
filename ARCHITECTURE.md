# 🏗️ Arquitetura Detalhada - Nexus Score

## Diagrama de Fluxo Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXUS SCORE ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │   Browser    │
                         │ (JavaScript) │
                         └──────┬───────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
        │  REST API   │  │  WebSocket   │  │  RabbitMQ    │
        │ (HTTP POST) │  │  (STOMP/JS)  │  │  (Publisher) │
        └──────┬──────┘  └───────┬──────┘  └──────┬───────┘
               │                 │                 │
               └─────────────────┼─────────────────┘
                                 │
                ┌────────────────▼────────────────┐
                │    SPRING BOOT APPLICATION      │
                │    (Port 8080)                  │
                │                                 │
                │  ┌──────────────────────────┐   │
                │  │   Controller Layer       │   │
                │  │ ┌────────────────────┐   │   │
                │  │ │ ScoreController    │   │   │
                │  │ │ GameController     │   │   │
                │  │ │ UserController     │   │   │
                │  │ └────────────────────┘   │   │
                │  └────────┬─────────────────┘   │
                │           │                     │
                │  ┌────────▼────────────────┐   │
                │  │   Service Layer        │   │
                │  │ ┌────────────────────┐  │   │
                │  │ │ ScoreService       │  │   │
                │  │ │ @RabbitListener    │  │   │
                │  │ │ consume from queue │  │   │
                │  │ └────────┬───────────┘  │   │
                │  │          │              │   │
                │  │ ┌────────▼────────────┐ │   │
                │  │ │ Strategy Factory    │ │   │
                │  │ │ + Strategies        │ │   │
                │  │ │ - DinoGameStrategy  │ │   │
                │  │ │ - FlappyBirdStrat   │ │   │
                │  │ └────────┬────────────┘ │   │
                │  │          │              │   │
                │  │ ┌────────▼────────────┐ │   │
                │  │ │ UserService        │ │   │
                │  │ │ GameService        │ │   │
                │  │ └────────────────────┘ │   │
                │  └───────┬────────────────┘   │
                │          │                    │
                │  ┌───────▼─────────────────┐  │
                │  │  Repository Layer      │  │
                │  │ ┌──────────────────────┤  │
                │  │ │ UserRepository       │  │
                │  │ │ GameRepository       │  │
                │  │ │ ScoreRepository      │  │
                │  │ └──────────────────────┤  │
                │  └───────┬─────────────────┘  │
                │          │ (JPA/Hibernate)   │
                └──────────┼───────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌──────────────┐  ┌──────────┐  ┌────────────────┐
   │ PostgreSQL   │  │RabbitMQ  │  │  WebSocket     │
   │ Port: 5432   │  │Port:5672 │  │ (Built-in)     │
   │              │  │          │  │                │
   │ ┌────────┐   │  │/scores.q │  │ /topic/        │
   │ │ users  │   │  │ueue      │  │standings       │
   │ │ games  │   │  │          │  │                │
   │ │ scores │   │  │Publisher │  │ (broadcast to  │
   │ │        │   │  │ publishes│  │  all clients)  │
   │ └────────┘   │  │scores    │  │                │
   └──────────────┘  └──────────┘  └────────────────┘
```

---

## Fluxo de Publicação de Score

```
CLIENT (FRONTEND)
│
├─ OPÇÃO 1: Publicar via REST
│  │
│  POST /api/scores/user/{id}/game/{id}
│  └─► ScoreController.getScoreById()
│      └─► ScoreService.getScoresByUser()
│          └─► Database
│
└─ OPÇÃO 2: Publicar via RabbitMQ
   │
   ┌─ Enviar mensagem para fila 'scores.queue'
   │
   └─► Message in Queue (ScoreDTO)
       {
         "userId": 1,
         "gameSlug": "dino-game",
         "value": 150,
         "metadata": "{...}"
       }
       │
       └─► ScoreService.consumeScore()
           │
           ├─► 1. Validar dados
           │   └─ usuário existe?
           │   └─ jogo existe?
           │
           ├─► 2. Buscar estratégia
           │   └─ GameStrategyFactory.getStrategy("dino-game")
           │       └─ retorna DinoGameStrategy
           │
           ├─► 3. Calcular score
           │   └─ strategy.calculateScore(data)
           │       └─ valor = 150 + (5*10) * 1.2 = 240
           │
           ├─► 4. Persistir no banco
           │   └─ scoreRepository.save(score)
           │       └─ INSERT INTO scores
           │
           └─► 5. Notificar via WebSocket
               └─ SimpMessagingTemplate.convertAndSend()
                   └─ enviar para /topic/standings
                       └─ BROADCAST para todos os clientes

BROWSER (JAVASCRIPT)
│
└─ Escuta /topic/standings
   └─ Recebe atualização em tempo real
       └─ Atualiza placar no DOM
```

---

## Camada de Modelo (Entidades)

```
┌─────────────────────────────────────────────────────────┐
│  USER (Usuário)                                         │
├─────────────────────────────────────────────────────────┤
│  - id: Long (PK)                                        │
│  - name: String                                         │
│  - email: String (UNIQUE)                               │
│  - password: String                                     │
│  - role: Enum (ADMIN, USER)                             │
│  - createdAt: LocalDateTime                             │
│  - updatedAt: LocalDateTime                             │
└─────────────────────────────────────────────────────────┘
         ▲
         │ 1..* (Um usuário tem muitos scores)
         │
┌─────────────────────────────────────────────────────────┐
│  SCORE (Pontuação)                                      │
├─────────────────────────────────────────────────────────┤
│  - id: Long (PK)                                        │
│  - value: Integer                                       │
│  - user: User (FK)                   ◄───── Relacionado │
│  - game: Game (FK)                   ◄───── com         │
│  - metadata: String (JSON)                              │
│  - createdAt: LocalDateTime                             │
└─────────────────────────────────────────────────────────┘
         ▲
         │ *..1 (Muitos scores para um jogo)
         │
┌─────────────────────────────────────────────────────────┐
│  GAME (Jogo)                                            │
├─────────────────────────────────────────────────────────┤
│  - id: Long (PK)                                        │
│  - title: String                                        │
│  - slug: String (UNIQUE)                                │
│  - category: String                                     │
│  - description: String                                  │
│  - createdAt: LocalDateTime                             │
│  - updatedAt: LocalDateTime                             │
└─────────────────────────────────────────────────────────┘
```

---

## Strategy Pattern - Resolução de Estratégia

```
┌────────────────────────────────────────────┐
│  GameStrategyFactory                       │
│  └─ List<GameScoreStrategy> strategies    │
└────────┬───────────────────────────────────┘
         │
    getStrategy(gameSlug)
         │
         ├─ gameSlug = "dino-game"
         │   └─ streams strategies
         │   └─ encontra DinoGameStrategy
         │       └─ strategy.getGameSlug() == "dino-game"
         │       └─ return DinoGameStrategy
         │
         ├─ gameSlug = "flappy-bird"
         │   └─ streams strategies
         │   └─ encontra FlappyBirdGameStrategy
         │       └─ strategy.getGameSlug() == "flappy-bird"
         │       └─ return FlappyBirdGameStrategy
         │
         └─ gameSlug = "desconhecido"
             └─ NoSuchElementException
             └─ "Nenhuma strategy encontrada"

┌──────────────────────────────────────────────┐
│  <<interface>>                                │
│  GameScoreStrategy                            │
├──────────────────────────────────────────────┤
│  + calculateScore(ScoreDTO): int              │
│  + getGameSlug(): String                      │
└──────────────────────────────────────────────┘
         │
         │ implements
         │
    ┌────┴────┐
    │          │
┌───▼──────────────┐          ┌───────────────────┐
│ DinoGameStrategy │          │FlappyBirdStrategy │
├──────────────────┤          ├───────────────────┤
│ calculateScore() │          │ calculateScore()  │
│ ├─ base = value  │          │ ├─ base = value   │
│ ├─ bonus = 10*n  │          │ ├─ bonus = 5*n    │
│ ├─ mult = 1.2^l  │          │ ├─ perfect = 50   │
│ └─ return result │          │ └─ return result  │
│                  │          │                   │
│ getGameSlug():   │          │ getGameSlug():    │
│ "dino-game"      │          │ "flappy-bird"     │
└──────────────────┘          └───────────────────┘
```

---

## Camada de Serviço

```
CLIENT REQUEST (HTTP/RabbitMQ)
│
└─► CONTROLLER LAYER
    ├─ ScoreController
    ├─ GameController
    ├─ UserController
    │
    └─► SERVICE LAYER
        │
        ├─ ScoreService
        │   ├─► @RabbitListener("scores.queue")
        │   │   └─ Consome mensagens
        │   │
        │   ├─► Dependency Injection:
        │   │   ├─ scoreRepository
        │   │   ├─ userRepository
        │   │   ├─ gameRepository
        │   │   ├─ strategyFactory
        │   │   └─ messagingTemplate (WebSocket)
        │   │
        │   └─► Métodos:
        │       ├─ consumeScore(ScoreDTO)
        │       ├─ getScoresByUserAndGame()
        │       ├─ getMaxScoreByUserAndGame()
        │       └─ notifyStandingsUpdate()
        │
        ├─ GameService
        │   ├─► CRUD Operations
        │   ├─► Validações
        │   └─► Mapeamento Entity ◄──► DTO
        │
        └─ UserService
            ├─► CRUD Operations
            ├─► Validações
            └─► Mapeamento Entity ◄──► DTO
        │
        └─► STRATEGY FACTORY
            └─ getStrategy(slug)
                └─ GameScoreStrategy (interface)
```

---

## WebSocket - Comunicação em Tempo Real

```
CLIENT (Browser/JavaScript)
│
├─ Conectar
│  └─ const socket = new SockJS('/ws');
│  └─ const stompClient = Stomp.over(socket);
│  └─ stompClient.connect({}, onConnected);
│
├─ Inscrever em Tópico
│  └─ stompClient.subscribe('/topic/standings', onMessageReceived);
│
└─ Receber Mensagens (em tempo real)
   └─ Servidor envia para: /topic/standings
      └─ Todas conexões inscritas recebem
         └─ onMessageReceived(message)
            └─ JSON.parse(message.body)
            └─ Atualizar UI

┌─────────────────────────────────────────┐
│  SERVER (Spring Boot)                   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ WebSocketConfig                  │   │
│  │                                  │   │
│  │ @EnableWebSocketMessageBroker    │   │
│  │ - SimpleBroker(/topic, /queue)   │   │
│  │ - setApplicationDestinationPrefix│   │
│  │ - registerStompEndpoints(/ws)    │   │
│  └──────────────────────────────────┘   │
│           │                              │
│           └─► ScoreService              │
│               └─ SimpMessagingTemplate  │
│                   .convertAndSend(      │
│                     "/topic/standings", │
│                     scoreDTO            │
│                   )                     │
│                                          │
└─────────────────────────────────────────┘
```

---

## RabbitMQ - Fila de Scores

```
┌──────────────────────────────────────────────┐
│  RABBITMQ BROKER (Port 5672)                 │
├──────────────────────────────────────────────┤
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │  scores.queue (Fila Durable)          │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │ Message 1: ScoreDTO             │  │  │
│  │  │ {                               │  │  │
│  │  │   userId: 1,                   │  │  │
│  │  │   gameSlug: "dino-game",        │  │  │
│  │  │   value: 150                    │  │  │
│  │  │ }                               │  │  │
│  │  ├─────────────────────────────────┤  │  │
│  │  │ Message 2: ScoreDTO             │  │  │
│  │  │ {                               │  │  │
│  │  │   userId: 2,                   │  │  │
│  │  │   gameSlug: "flappy-bird",      │  │  │
│  │  │   value: 45                     │  │  │
│  │  │ }                               │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └────────────┬──────────────────────────┘  │
│               │ @RabbitListener             │
│               │                            │
│  ┌────────────▼──────────────────────────┐  │
│  │ Consumer: ScoreService.consumeScore() │  │
│  │                                      │  │
│  │ 1. Validate                         │  │
│  │ 2. Get Strategy                     │  │
│  │ 3. Calculate Score                  │  │
│  │ 4. Save to DB                       │  │
│  │ 5. Send via WebSocket               │  │
│  └───────────────────────────────────────┘  │
│                                             │
└──────────────────────────────────────────────┘
```

---

## Banco de Dados - PostgreSQL

```
CONNECTION: jdbc:postgresql://db:5432/nexus_db
USER: admin
PASSWORD: senha_forte
PORT: 5432

DATABASE SCHEMA
├─ TABLE: users
│  ├─ id (BIGINT PK)
│  ├─ name (VARCHAR 100)
│  ├─ email (VARCHAR 100 UNIQUE)
│  ├─ password (VARCHAR)
│  ├─ role (VARCHAR "USER"/"ADMIN")
│  ├─ created_at (TIMESTAMP)
│  └─ updated_at (TIMESTAMP)
│  
├─ TABLE: games
│  ├─ id (BIGINT PK)
│  ├─ title (VARCHAR 100)
│  ├─ slug (VARCHAR 100 UNIQUE)
│  ├─ category (VARCHAR 50)
│  ├─ description (VARCHAR 500)
│  ├─ created_at (TIMESTAMP)
│  └─ updated_at (TIMESTAMP)
│
└─ TABLE: scores
   ├─ id (BIGINT PK)
   ├─ value (INTEGER)
   ├─ user_id (BIGINT FK → users.id)
   ├─ game_id (BIGINT FK → games.id)
   ├─ metadata (JSONB)
   └─ created_at (TIMESTAMP)
```

---

## Fluxo Completo - Exemplo Prático

```
CENÁRIO: Usuário joga Dino Game e obtém 150 pontos + 5 inimigos

1. FRONTEND envia para RabbitMQ
   └─ Message: {userId: 1, gameSlug: "dino-game", value: 150, 
                 metadata: "{enemies_defeated: 5, level: 2}"}

2. RabbitMQ Queue
   └─ scores.queue ← Message armazenada

3. ScoreService escuta (@RabbitListener)
   └─ consumeScore(scoreDTO) é chamado

4. Validações
   ├─ User ID=1 existe? ✓
   └─ Game slug="dino-game" existe? ✓

5. Buscar Estratégia
   └─ strategyFactory.getStrategy("dino-game")
       └─ retorna: DinoGameStrategy instance

6. Calcular Score (DinoGameStrategy)
   ├─ baseScore = 150
   ├─ enemyBonus = 5 * 10 = 50
   ├─ levelMultiplier = 1.2^(2-1) = 1.2
   └─ finalScore = (150 + 50) * 1.2 = 240

7. Persistir no PostgreSQL
   └─ INSERT INTO scores (user_id, game_id, value, metadata, created_at)
       VALUES (1, 1, 240, '...', NOW())

8. Notificar via WebSocket
   └─ SimpMessagingTemplate.convertAndSend("/topic/standings", scoreDTO)
       └─ Broadcast para todos os clientes conectados

9. BROWSER recebe
   ├─ subscribe('/topic/standings', handler)
   └─ handler(message)
       └─ Atualiza placar na UI

RESULTADO NO BANCO:
scores table:
│ id │ user_id │ game_id │ value │ metadata          │ created_at     │
├────┼─────────┼─────────┼───────┼───────────────────┼────────────────┤
│ 1  │ 1       │ 1       │ 240   │ {...}             │ 2024-06-01...  │
```

---

## Padrões de Design Utilizados

### 1. Strategy Pattern
```
GameScoreStrategy (interface)
├─ DinoGameStrategy
└─ FlappyBirdGameStrategy

Necessidade: Diferentes jogos, diferentes cálculos
Solução: Cada jogo implementa sua própria estratégia
Benefício: Open/Closed Principle - adicionar novo jogo sem modificar existente
```

### 2. Factory Pattern
```
GameStrategyFactory
└─ getStrategy(gameSlug): GameScoreStrategy

Necessidade: Resolver a strategy correta dinamicamente
Solução: Factory injeta todas strategies e localiza
Benefício: Centraliza lógica de resolução
```

### 3. Repository Pattern
```
UserRepository, GameRepository, ScoreRepository
extends JpaRepository

Necessidade: Abstrair acesso a dados
Solução: Spring Data JPA fornece operações
Benefício: Fácil trocar de banco sem alterar serviço
```

### 4. DTO Pattern
```
UserDTO, GameDTO, ScoreDTO, StandingsDTO

Necessidade: Isolar entidades das APIs
Solução: Camada de transferência de dados
Benefício: Segurança (não expor campos internos)
```

### 5. Dependency Injection
```
@Service + @RequiredArgsConstructor + final fields

Necessidade: Desacoplar componentes
Solução: Spring injeta dependências
Benefício: Testabilidade, flexibilidade
```

---

## SOLID Principles Applied

```
S - Single Responsibility
  └─ Cada classe tem seu propósito:
     ScoreService: lógica de scores
     GameService: lógica de jogos
     DinoGameStrategy: cálculo dino

O - Open/Closed
  └─ Aberto para extensão via Strategy Pattern
     Novo jogo: nova Strategy, sem modificar código

L - Liskov Substitution
  └─ Qualquer GameScoreStrategy funciona igual
     ScoreService não precisa saber qual estratégia

I - Interface Segregation
  └─ GameScoreStrategy tem apenas métodos necessários
     Não força implementar métodos desnecessários

D - Dependency Inversion
  └─ Depende de abstrações (interfaces)
     GameStrategyFactory não depende de implementações
```

---

**Última Atualização**: 2024-06-01  
**Versão**: 1.0.0

