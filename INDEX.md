# 📚 Índice Completo - Nexus Score

Bem-vindo ao **Nexus Score** - um Hub de Jogos com arquitetura profissional em Spring Boot!

Este documento índice ajuda na navegação por toda a documentação e código base.

---

## 🚀 Para Começar Rapidamente

1. **Quer executar logo?** → [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Quer ver exemplos de API?** → [EXAMPLES.md](./EXAMPLES.md)
3. **Quer entender a arquitetura?** → [README.md](./README.md)
4. **Quer diagramas detalhados?** → [ARCHITECTURE.md](./ARCHITECTURE.md)
5. **Quer um sumário?** → [SUMMARY.md](./SUMMARY.md)

---

## 📂 Estrutura do Projeto

```
demo/
│
├── 📖 DOCUMENTAÇÃO
│   ├── README.md              ← Documentação Principal (COMECE AQUI)
│   ├── GETTING_STARTED.md     ← Guia de Execução (Docker + Local)
│   ├── EXAMPLES.md            ← Exemplos de Requisições HTTP/WebSocket
│   ├── ARCHITECTURE.md        ← Diagramas e Arquitetura Detalhada
│   ├── SUMMARY.md             ← Sumário Executivo
│   └── INDEX.md               ← Este arquivo
│
├── 🐳 CONFIGURAÇÃO DOCKER
│   ├── docker-compose.yml     ← Orquestração (PostgreSQL + RabbitMQ + App)
│   └── Dockerfile             ← Build da aplicação
│
├── ⚙️ CONFIGURAÇÃO SPRING
│   ├── pom.xml                ← Dependências Maven
│   └── src/main/resources/
│       └── application.yml    ← Configuração da aplicação
│
├── ☕ CÓDIGO-FONTE JAVA (src/main/java/com/example/nexus/)
│   │
│   ├── 📍 Modelos (model/)
│   │   ├── User.java          ← Usuário do sistema
│   │   ├── Game.java          ← Jogo do Hub
│   │   ├── Score.java         ← Pontuação registrada
│   │   └── Role.java          ← Enum: ADMIN, USER
│   │
│   ├── 📮 DTOs (dto/)
│   │   ├── UserDTO.java       ← Transferência segura de usuário
│   │   ├── GameDTO.java       ← Transferência segura de jogo
│   │   ├── ScoreDTO.java      ← Transferência de pontuação
│   │   └── StandingsDTO.java  ← Placar para WebSocket
│   │
│   ├── 🔑 Repositórios (repository/)
│   │   ├── UserRepository.java    ← Acesso a dados de User
│   │   ├── GameRepository.java    ← Acesso a dados de Game
│   │   └── ScoreRepository.java   ← Acesso a dados de Score
│   │
│   ├── 🎯 Estratégias (service/strategy/)
│   │   ├── GameScoreStrategy.java          ← Interface de Strategy
│   │   ├── DinoGameStrategy.java           ← Implementação Dino
│   │   ├── FlappyBirdGameStrategy.java     ← Implementação Flappy
│   │   └── GameStrategyFactory.java        ← Factory de resolução
│   │
│   ├── ⚙️ Serviços (service/)
│   │   ├── ScoreService.java      ← Lógica de scores + @RabbitListener
│   │   ├── GameService.java       ← Lógica de jogos
│   │   └── UserService.java       ← Lógica de usuários
│   │
│   ├── 🎮 Controladores (controller/)
│   │   ├── ScoreController.java   ← API REST de scores
│   │   ├── GameController.java    ← API REST de jogos
│   │   └── UserController.java    ← API REST de usuários
│   │
│   ├── ⚙️ Configurações (config/)
│   │   ├── RabbitMQConfig.java    ← Configuração do RabbitMQ
│   │   └── WebSocketConfig.java   ← Configuração do WebSocket
│   │
│   └── 🚀 NexusApplication.java   ← Aplicação principal
│
└── 🧪 TESTES (src/test/)
    └── NexusApplicationTests.java  ← Testes da aplicação
```

---

## 📖 Guia de Leitura Recomendado

### Para o Arquiteto/Tech Lead
1. [README.md](./README.md) - Visão geral completa
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Fluxos e padrões
3. [pom.xml](./pom.xml) - Dependências

### Para o Desenvolvedor
1. [GETTING_STARTED.md](./GETTING_STARTED.md) - Como executar
2. [EXAMPLES.md](./EXAMPLES.md) - Como testar
3. Código-fonte conforme necessidade

### Para o DevOps
1. [docker-compose.yml](./docker-compose.yml) - Orquestração
2. [Dockerfile](./Dockerfile) - Build
3. [application.yml](./src/main/resources/application.yml) - Configuração

### Para o QA/Tester
1. [EXAMPLES.md](./EXAMPLES.md) - Requisições HTTP
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Fluxos
3. [docker-compose.yml](./docker-compose.yml) - Ambiente

---

## 🎯 Endpoints Disponíveis

### Users
```
POST   /api/users                       Criar usuário
GET    /api/users                       Listar todos
GET    /api/users/{userId}              Obter por ID
GET    /api/users/email/{email}         Obter por email
PUT    /api/users/{userId}              Atualizar
DELETE /api/users/{userId}              Deletar
```

### Games
```
POST   /api/games                       Criar jogo
GET    /api/games                       Listar todos
GET    /api/games/{gameId}              Obter por ID
GET    /api/games/slug/{slug}           Obter por slug
GET    /api/games/category/{category}   Listar por categoria
PUT    /api/games/{gameId}              Atualizar
DELETE /api/games/{gameId}              Deletar
```

### Scores
```
GET    /api/scores/{scoreId}                            Obter score
GET    /api/scores/user/{userId}                         Scores do usuário
GET    /api/scores/user/{userId}/game/{gameId}           Scores em um jogo
GET    /api/scores/user/{userId}/game/{gameId}/max       Maior score
```

### WebSocket
```
CONNECT /ws                          WebSocket endpoint
SUBSCRIBE /topic/standings           Tópico de placar
```

---

## 🏗️ Stack Tecnológico

| Componente | Tecnologia | Descrição |
|-----------|-----------|-----------|
| Framework | Spring Boot 4.0.6 | Aplicação REST + WebSocket |
| Linguagem | Java 17 | Linguagem de programação |
| Banco | PostgreSQL 15 | Persistência de dados |
| Fila | RabbitMQ 3 | Message broker |
| ORM | Hibernate 6 | Mapeamento Object-Relational |
| Build | Maven 3.8+ | Gerenciador de dependências |
| Utilidades | Lombok | Redução de boilerplate |
| REST | Spring MVC | Controllers e mapping |
| WebSocket | Spring WebSocket | Comunicação em tempo real |
| AMQP | Spring AMQP | Producer/Consumer RabbitMQ |

---

## 🎓 Padrões de Design Implementados

| Padrão | Localização | Benefício |
|--------|-----------|-----------|
| **Strategy** | service/strategy/ | Fácil adicionar novos jogos |
| **Factory** | GameStrategyFactory | Resolver strategy dinamicamente |
| **Repository** | repository/ | Abstrair acesso a dados |
| **DTO** | dto/ | Segurança e controle de API |
| **Dependency Injection** | config/ | Desacoplamento |
| **Message-Driven** | ScoreService | Processamento assíncrono |
| **Pub/Sub** | WebSocket | Comunicação real-time |
| **Adapter** | Mapper Service ↔ DTO | Transformação de dados |

---

## 💎 Princípios SOLID Aplicados

- ✅ **Single Responsibility**: Cada classe tem uma única responsabilidade
- ✅ **Open/Closed**: Aberto para extensão, fechado para modificação
- ✅ **Liskov Substitution**: Strategies intercambiáveis
- ✅ **Interface Segregation**: Interfaces mínimas e coesas
- ✅ **Dependency Inversion**: Depende de abstrações

---

## 🚀 Executar Localmente

### Opção 1: Docker Compose (Recomendado)
```bash
cd demo
docker-compose up
# Acesse: http://localhost:8080/api/games
```

### Opção 2: Execução Local
```bash
cd demo
mvn spring-boot:run
# Precisa de PostgreSQL e RabbitMQ rodando localmente
```

---

## 🔐 Arquitetura de Segurança

```
┌────────────────┐
│  Frontend      │
│  (JavaScript)  │
└────────┬───────┘
         │ HTTPS (produção)
         ▼
┌──────────────────────┐
│  Spring Boot 8080    │
│  - JWT (futuro)      │
│  - CORS              │
│  - Rate Limiting     │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
PostgreSQL    RabbitMQ
(encriptado)  (vhost)
```

---

## 📊 Fluxo Completo - Um Score

```
Browser Frontend
    │
    └─► Joga jogo, obtém pontuação
        │
        └─► Envia para RabbitMQ
            {userId: 1, gameSlug: "dino-game", value: 150}
            │
            └─► scores.queue (armazena)
                │
                └─► @RabbitListener em ScoreService
                    │
                    ├─► Valida user e game
                    │
                    ├─► GameStrategyFactory.getStrategy()
                    │   └─► DinoGameStrategy
                    │
                    ├─► calculateScore()
                    │   └─► valor = 240
                    │
                    ├─► scoreRepository.save()
                    │   └─► INSERT em PostgreSQL
                    │
                    └─► SimpMessagingTemplate broadcast
                        └─► /topic/standings
                            │
                            └─► JavaScript receives
                                └─► Atualiza placar Real-time
```

---

## 🧪 Testar a Aplicação

```bash
# 1. Criar usuário
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@test.com","role":"USER"}'

# 2. Criar jogo
curl -X POST http://localhost:8080/api/games \
  -H "Content-Type: application/json" \
  -d '{"title":"Dino","slug":"dino-game","category":"arcade"}'

# 3. Ver usuários
curl http://localhost:8080/api/users

# Ver EXAMPLES.md para mais exemplos
```

---

## 🎯 Próximas Melhorias

### Curto Prazo (1-2 semanas)
- [ ] Implementar testes unitários (JUnit 5)
- [ ] Autenticação JWT + Spring Security
- [ ] Validação robusta com @Valid
- [ ] Exception handler global

### Médio Prazo (2-4 semanas)
- [ ] Documentação Swagger/OpenAPI
- [ ] Caching com Redis
- [ ] Rate limiting
- [ ] Database pagination

### Longo Prazo (1-2 meses)
- [ ] Frontend React/Vue/Angular
- [ ] Mais estratégias de jogos
- [ ] CI/CD Pipeline
- [ ] Monitoramento com Prometheus/Grafana

---

## 🤝 Contribuindo

Para adicionar um novo jogo:

1. Criar classe em `service/strategy/` implementando `GameScoreStrategy`
2. Implementar `calculateScore()` com sua lógica
3. Implementar `getGameSlug()` com identificador único
4. Criar entidade Game com o slug
5. `GameStrategyFactory` descobrirá automaticamente

Exemplo:
```java
@Slf4j
@Component
public class PacManGameStrategy implements GameScoreStrategy {
    private static final String GAME_SLUG = "pac-man";
    
    @Override
    public int calculateScore(ScoreDTO data) {
        // Sua lógica aqui
        return calculatedScore;
    }
    
    @Override
    public String getGameSlug() {
        return GAME_SLUG;
    }
}
```

---

## 📞 Suporte e Troubleshooting

### Docker não inicia
```bash
docker-compose logs
docker-compose down -v
docker-compose up --build
```

### Porta ocupada
```bash
# Linux/macOS
lsof -i :8080

# Windows
netstat -ano | findstr :8080
```

### Erro de conexão ao PostgreSQL
```bash
docker ps | grep postgres
docker logs <container-id>
```

### Erro ao compilar
```bash
mvn clean install
docker-compose up --build
```

---

## 📚 Referências Externas

- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Spring AMQP](https://spring.io/projects/spring-amqp)
- [RabbitMQ Docs](https://www.rabbitmq.com/documentation.html)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## ✅ Checklist de Implementação

- ✅ Arquitetura em camadas
- ✅ Strategy Pattern funcionando
- ✅ RabbitMQ integrado
- ✅ WebSocket configurado
- ✅ PostgreSQL pronto
- ✅ Docker Compose disponível
- ✅ Documentação completa
- ✅ Exemplos fornecidos
- ✅ SOLID principles aplicados
- ✅ 19 classes Java + 5 documentações

---

## 📞 Perguntas Frequentes (FAQ)

**P: Por que Strategy Pattern?**  
R: Para suportar múltiplos jogos com cálculos diferentes sem modificar código existente.

**P: Por que RabbitMQ?**  
R: Para desacoplamento temporal e garantia de entrega de mensagens.

**P: Por que WebSocket?**  
R: Para comunicação bidirecional eficiente e atualizações em tempo real.

**P: Como adicionar novo jogo?**  
R: Criar nova Strategy class, implementar interface, pronto!

**P: Como rodar sem Docker?**  
R: Leia GETTING_STARTED.md na seção "Executar Localmente".

**P: Usar em produção?**  
R: Adicione autenticação JWT, hash de senhas, validação robusta e HTTPS.

---

## 📞 Contato

- **Projeto**: Nexus Score - Hub de Jogos
- **Versão**: 1.0.0
- **Data**: 2024-06-01
- **Status**: Pronto para desenvolvimento e testes ✅

---

**Última atualização**: 2024-06-01  
**Mantido por**: Nexus Score Team  
**Licença**: MIT (para fins educacionais)

