# Exemplos de Requisições API - Nexus Score

## 🔷 USERS (Usuários)

### 1. Criar Usuário
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senha123",
    "role": "USER"
  }'
```

**Resposta Esperada (201 Created)**:
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "role": "USER",
  "createdAt": "2024-06-01T10:30:00"
}
```

### 2. Listar Todos os Usuários
```bash
curl -X GET http://localhost:8080/api/users
```

### 3. Obter Usuário por ID
```bash
curl -X GET http://localhost:8080/api/users/1
```

### 4. Obter Usuário por Email
```bash
curl -X GET http://localhost:8080/api/users/email/joao@email.com
```

### 5. Atualizar Usuário
```bash
curl -X PUT http://localhost:8080/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Atualizado",
    "email": "joao.novo@email.com",
    "role": "ADMIN"
  }'
```

### 6. Deletar Usuário
```bash
curl -X DELETE http://localhost:8080/api/users/1
```

---

## 🎮 GAMES (Jogos)

### 1. Criar Jogo - Dino Game
```bash
curl -X POST http://localhost:8080/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dino Game",
    "slug": "dino-game",
    "category": "arcade",
    "description": "Clássico jogo do dinossauro do Chrome"
  }'
```

### 2. Criar Jogo - Flappy Bird
```bash
curl -X POST http://localhost:8080/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Flappy Bird",
    "slug": "flappy-bird",
    "category": "casual",
    "description": "Jogo de reflexo tipo Flappy Bird"
  }'
```

### 3. Listar Todos os Jogos
```bash
curl -X GET http://localhost:8080/api/games
```

### 4. Obter Jogo por ID
```bash
curl -X GET http://localhost:8080/api/games/1
```

### 5. Obter Jogo por Slug
```bash
curl -X GET http://localhost:8080/api/games/slug/dino-game
```

### 6. Listar Jogos por Categoria
```bash
curl -X GET http://localhost:8080/api/games/category/arcade
```

### 7. Atualizar Jogo
```bash
curl -X PUT http://localhost:8080/api/games/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dino Game - Versão 2",
    "slug": "dino-game",
    "category": "arcade",
    "description": "Versão melhorada do jogo"
  }'
```

### 8. Deletar Jogo
```bash
curl -X DELETE http://localhost:8080/api/games/1
```

---

## 📊 SCORES (Pontuações)

### 1. Obter Score Específico
```bash
curl -X GET http://localhost:8080/api/scores/1
```

### 2. Listar Todos os Scores de um Usuário
```bash
curl -X GET http://localhost:8080/api/scores/user/1
```

### 3. Listar Scores de um Usuário em um Jogo
```bash
curl -X GET http://localhost:8080/api/scores/user/1/game/1
```

### 4. Obter Maior Score do Usuário em um Jogo
```bash
curl -X GET http://localhost:8080/api/scores/user/1/game/1/max
```

---

## 📨 RABBITMQ - Enviar Score

### Enviar Score para Fila (via RabbitMQ)

Você pode publicar uma mensagem na fila `scores.queue`:

```json
{
  "userId": 1,
  "gameSlug": "dino-game",
  "value": 150,
  "metadata": "{\"distance\": 150, \"enemies_defeated\": 5, \"level\": 2}"
}
```

**Usando CLI do RabbitMQ**:
```bash
# Conectar ao container
docker exec -it rabbitmq-nexus bash

# Dentro do container, usar o comando rabbitmqctl
rabbitmqctl list_queues

# Usar outro cliente para publicar (e.g., amqp-cli, ou aplicação Python)
```

**Exemplo com Python**:
```python
import pika
import json

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

channel.queue_declare(queue='scores.queue', durable=True)

message = {
    "userId": 1,
    "gameSlug": "dino-game",
    "value": 150,
    "metadata": '{"distance": 150, "enemies_defeated": 5, "level": 2}'
}

channel.basic_publish(
    exchange='',
    routing_key='scores.queue',
    body=json.dumps(message),
    properties=pika.BasicProperties(delivery_mode=2)  # durable
)

print("Score enviado para fila!")
connection.close()
```

### Monitorar Fila RabbitMQ

```bash
# Acessar painel RabbitMQ
http://localhost:15672
# user: guest
# password: guest
```

---

## 🔌 WEBSOCKET - Receber Atualizações em Tempo Real

### Cliente JavaScript/HTML

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/1.5.4/sockjs.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js"></script>
</head>
<body>
    <h1>Nexus Score - Live Standings</h1>
    <div id="standings"></div>

    <script>
        // Conectar ao WebSocket
        const socket = new SockJS('/ws');
        const stompClient = Stomp.over(socket);

        stompClient.connect({}, function(frame) {
            console.log('Connected: ' + frame.version);

            // Se inscrever no tópico de standings
            stompClient.subscribe('/topic/standings', function(message) {
                const score = JSON.parse(message.body);
                displayScore(score);
            });
        }, function(error) {
            console.error('Connection error:', error);
        });

        function displayScore(score) {
            const html = `
                <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0;">
                    <strong>${score.userName}</strong> - Jogo: ${score.gameTitle}
                    <br/>
                    Score: <strong>${score.value}</strong>
                    <br/>
                    Tempo: ${score.createdAt}
                </div>
            `;
            document.getElementById('standings').innerHTML += html;
        }
    </script>
</body>
</html>
```

---

## 🔄 Fluxo Completo - Do Score ao WebSocket

1. **Frontend envia score** para servidor (via REST ou RabbitMQ)

2. **RabbitMQ** coloca na fila `scores.queue`

3. **ScoreService** consome (@RabbitListener)
   - Valida usuário e jogo
   - Obtém Strategy via GameStrategyFactory
   - Calcula score via Strategy
   - Persiste no banco

4. **WebSocket** notifica
   - SimpMessagingTemplate envia para `/topic/standings`
   - Todos os clientes conectados recebem em tempo real

5. **Frontend** exibe score no placar live

---

## 📝 Exemplo Completo - DinoGame

### 1. Criar Usuário
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Player1","email":"player1@email.com","role":"USER"}'
```
Response: `{ "id": 1, ... }`

### 2. Criar Jogo
```bash
curl -X POST http://localhost:8080/api/games \
  -H "Content-Type: application/json" \
  -d '{"title":"Dino Game","slug":"dino-game","category":"arcade","description":"Dino Chrome"}'
```
Response: `{ "id": 1, ... }`

### 3. Enviar Score via RabbitMQ
```json
{
  "userId": 1,
  "gameSlug": "dino-game",
  "value": 150,
  "metadata": "{\"distance\": 150, \"enemies_defeated\": 5, \"level\": 2}"
}
```

### 4. ScoreService Processa
- Calcula: (150 + 50) * 1.2 = 240 pontos
- Salva no banco
- Envia via WebSocket para `/topic/standings`

### 5. Frontend Recebe
```json
{
  "id": 1,
  "value": 240,
  "userId": 1,
  "userName": "Player1",
  "gameSlug": "dino-game",
  "gameTitle": "Dino Game",
  "createdAt": "2024-06-01T10:30:00"
}
```

---

## 🐛 Troubleshooting

### PostgreSQL não conecta
```bash
# Verificar se está rodando
docker ps | grep postgres

# Verificar logs
docker logs <container-id>
```

### RabbitMQ não conecta
```bash
# Verificar se está rodando
docker ps | grep rabbitmq

# Acessar painel
http://localhost:15672
```

### Verificar logs da aplicação
```bash
docker logs -f <app-container-id>
```

---

## 📚 Referências

- [Spring Boot REST](https://spring.io/guides/gs/rest-service/)
- [Spring AMQP](https://spring.io/projects/spring-amqp)
- [Spring WebSocket](https://spring.io/guides/gs/messaging-stomp-websocket/)
- [Docker Compose](https://docs.docker.com/compose/)
- [RabbitMQ](https://www.rabbitmq.com/)

