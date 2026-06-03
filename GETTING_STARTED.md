# 🚀 Guia de Execução - Nexus Score

## Arquitetura Implementada

```
Nexus Score (Spring Boot 4.0.6 + Java 17)
│
├── PostgreSQL 15 (Banco de Dados)
│   └── Tabelas: users, games, scores
│
├── RabbitMQ 3 Management (Message Broker)
│   └── Fila: scores.queue
│
└── WebSocket (Comunicação em Tempo Real)
    └── Tópico: /topic/standings
```

## 📋 Pré-requisitos

- **Docker Desktop** instalado e rodando
- **Docker Compose** instalado (vem com Docker Desktop)
- **Maven 3.8+** (opcional, para build local)
- **Java 17+** (opcional, para execução local)

## 🐳 Executar com Docker Compose

### 1. Estrutura do Projeto

Certifique-se de que você está na pasta raiz do projeto:

```
Nexus/
├── demo/
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── ...
```

### 2. Executar Docker Compose

```bash
# Ir para a pasta do projeto
cd Nexus/demo

# Iniciar todos os serviços
docker-compose up

# Ou em background
docker-compose up -d

# Ver logs
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f rabbitmq
```

### 3. Aguardar Inicialização

A aplicação leva ~30 segundos para iniciar. Procure por:
```
app       | ... Started NexusApplication in ... seconds
```

### 4. Testar a Aplicação

```bash
# Verificar saúde da API
curl http://localhost:8080/api/users
```

### 5. Parar os Serviços

```bash
# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

---

## 💻 Executar Localmente (Sem Docker)

### 1. Iniciar PostgreSQL

```bash
# Windows (usando Docker, sem Docker Compose)
docker run --name postgres-nexus ^
  -e POSTGRES_USER=admin ^
  -e POSTGRES_PASSWORD=senha_forte ^
  -e POSTGRES_DB=nexus_db ^
  -p 5432:5432 ^
  -d postgres:15

# macOS/Linux
docker run --name postgres-nexus \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=senha_forte \
  -e POSTGRES_DB=nexus_db \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Iniciar RabbitMQ

```bash
# Windows
docker run --name rabbitmq-nexus ^
  -p 5672:5672 ^
  -p 15672:15672 ^
  -d rabbitmq:3-management

# macOS/Linux
docker run --name rabbitmq-nexus \
  -p 5672:5672 \
  -p 15672:15672 \
  -d rabbitmq:3-management
```

### 3. Compilar a Aplicação

```bash
# Na pasta do projeto
cd Nexus/demo

# Compilar com Maven
mvn clean install

# Ou apenas compilar (sem rodar testes)
mvn clean compile
```

### 4. Executar a Aplicação

```bash
# Opção 1: Com Maven (desenvolvimento)
mvn spring-boot:run

# Opção 2: Executar JAR gerado
java -jar target/nexus-0.0.1-SNAPSHOT.jar

# Opção 3: IDE (IntelliJ/Eclipse)
# Clicar em "Run" em NexusApplication.java
```

### 5. Verificar se Está Rodando

```bash
# Deve retornar uma lista vazia []
curl http://localhost:8080/api/games
```

---

## 📊 Painéis de Administração

### RabbitMQ Management

```
URL: http://localhost:15672
User: guest
Password: guest
```

Funcionalidades:
- Ver filas e mensagens
- Monitorar consumo
- Testar publicação de mensagens

### PostgreSQL (pgAdmin - Opcional)

Se quiser usar pgAdmin, adicione ao docker-compose.yml:

```yaml
pgadmin:
  image: dpage/pgadmin4
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@admin.com
    PGADMIN_DEFAULT_PASSWORD: admin
  ports:
    - "5050:80"
  depends_on:
    - db
```

Então acesse: `http://localhost:5050`

---

## 📝 Configuração da Aplicação

### application.yml

Location: `src/main/resources/application.yml`

**Importante**: Para Docker, os hosts devem ser:
- `db` (não localhost, pois está na mesma rede Docker)
- `rabbitmq` (mesmo motivo)

Para execução local fora do Docker, mude para:
- `localhost` ou `127.0.0.1`

```yaml
# Para Docker Compose:
spring:
  datasource:
    url: jdbc:postgresql://db:5432/nexus_db
  rabbitmq:
    host: rabbitmq

# Para execução local:
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/nexus_db
  rabbitmq:
    host: localhost
```

---

## 🔧 Troubleshooting

### Aplicação não inicia

**Problema**: Container para sem mensagem de erro
```bash
# Solução: Ver logs detalhados
docker-compose logs app
```

**Problema**: `Caused by: java.lang.ClassNotFoundException`
```bash
# Solução: Limpar cache Maven e reconstruir
mvn clean install
docker-compose up --build
```

### Erro de Conexão ao PostgreSQL

**Problema**: `Connection refused: connect`
```bash
# Verificar se container está rodando
docker ps | grep postgres

# Reiniciar container
docker restart postgres-nexus

# Ou recrear
docker-compose down && docker-compose up
```

### Erro de Conexão ao RabbitMQ

**Problema**: `Connection refused`
```bash
# Verificar se está rodando
docker ps | grep rabbitmq

# Aguarde mais alguns segundos para inicializar

# Testar conexão
curl http://localhost:15672/api/vhosts
```

### Porta já em uso

**Problema**: `Address already in use: bind`
```bash
# Linux/macOS: Encontrar processo usando a porta
lsof -i :8080

# Windows: Encontrar processo usando a porta
netstat -ano | findstr :8080

# Matar processo (Linux/macOS)
kill -9 <PID>

# Matar processo (Windows)
taskkill /PID <PID> /F

# Ou usar portas diferentes no docker-compose.yml
ports:
  - "8081:8080"  # Mapeia 8081 (local) para 8080 (container)
```

### Erro ao fazer build do Docker

**Problema**: `failed to get output`
```bash
# Verificar se Maven está instalado no container
docker build --no-cache -t nexus-score .

# Ou limpar Docker
docker system prune -a
docker-compose up --build
```

---

## 🧪 Testar a Aplicação

### 1. Criar Usuário

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João",
    "email": "joao@test.com",
    "role": "USER"
  }'
```

### 2. Criar Jogo

```bash
curl -X POST http://localhost:8080/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dino Game",
    "slug": "dino-game",
    "category": "arcade",
    "description": "Dinossauro Google Chrome"
  }'
```

### 3. Verificar Dados

```bash
# Listar usuários
curl http://localhost:8080/api/users

# Listar jogos
curl http://localhost:8080/api/games
```

### 4. Publicar Score (via RabbitMQ)

Ver arquivo `EXAMPLES.md` para exemplos de como publicar scores.

---

## 📦 Estrutura de Arquivos Criados

```
demo/
├── src/
│   ├── main/
│   │   ├── java/com/example/nexus/
│   │   │   ├── NexusApplication.java
│   │   │   ├── controller/
│   │   │   │   ├── UserController.java
│   │   │   │   ├── GameController.java
│   │   │   │   └── ScoreController.java
│   │   │   ├── service/
│   │   │   │   ├── UserService.java
│   │   │   │   ├── GameService.java
│   │   │   │   ├── ScoreService.java (com @RabbitListener)
│   │   │   │   └── strategy/
│   │   │   │       ├── GameScoreStrategy.java (interface)
│   │   │   │       ├── DinoGameStrategy.java
│   │   │   │       ├── FlappyBirdGameStrategy.java
│   │   │   │       └── GameStrategyFactory.java
│   │   │   ├── repository/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── GameRepository.java
│   │   │   │   └── ScoreRepository.java
│   │   │   ├── model/
│   │   │   │   ├── User.java
│   │   │   │   ├── Game.java
│   │   │   │   ├── Score.java
│   │   │   │   └── Role.java
│   │   │   ├── dto/
│   │   │   │   ├── UserDTO.java
│   │   │   │   ├── GameDTO.java
│   │   │   │   ├── ScoreDTO.java
│   │   │   │   └── StandingsDTO.java
│   │   │   └── config/
│   │   │       ├── RabbitMQConfig.java
│   │   │       └── WebSocketConfig.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/com/example/nexus/
│           └── NexusApplicationTests.java
├── pom.xml
├── Dockerfile
├── docker-compose.yml
├── README.md (documentação completa)
├── EXAMPLES.md (exemplos de requests)
└── GETTING_STARTED.md (este arquivo)
```

---

## 🎯 Próximos Passos

1. **Implementar Autenticação JWT**
   - Adicionar Spring Security
   - Gerar tokens JWT
   - Validar em endpoints protegidos

2. **Adicionar Hash de Senha**
   - Usar BCrypt
   - Alterar `UserService.createUser()`

3. **Criar Testes Unitários**
   - Testes para Services
   - Testes para Controllers
   - Cobertura mínima: 80%

4. **Implementar Validação Robusta**
   - Usar `@Valid` e `@Validated`
   - Custom validators
   - Global exception handler

5. **Melhorar Segurança**
   - CORS adequado
   - Rate limiting
   - Input sanitization

6. **Documentação com Swagger/OpenAPI**
   - `springdoc-openapi-starter-webmvc-ui`
   - Acessar em `http://localhost:8080/swagger-ui.html`

---

## 📞 Suporte

Para problemas, verifique:
1. `docker-compose logs`
2. Arquivo `README.md` para arquitetura
3. Arquivo `EXAMPLES.md` para exemplos
4. Logs da aplicação em `application.yml`

---

**Versão**: 1.0.0  
**Data**: 2024-06-01  
**Status**: Pronto para Desenvolvimento ✅

