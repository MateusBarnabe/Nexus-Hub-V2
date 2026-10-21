# Relatório de Auditoria de Segurança: Nexus Hub / Nexus Score

Este documento apresenta uma análise detalhada das vulnerabilidades e brechas de segurança identificadas no código-fonte do projeto **Nexus**, acompanhado de recomendações práticas de mitigação e implementação.

---

## 1. Vulnerabilidades de Alta Severidade

### 🚨 Senhas em Texto Plano (Ausência de Criptografia / Hashing)
* **Onde:** [UserService.java](file:///C:/Users/polux/OneDrive/%C3%81rea%20de%20Trabalho/Faculdade/Projeto%20Integrador/Nexus/demo/src/main/java/com/example/nexus/service/UserService.java#L54)
* **Detalhes:** No método `createUser`, a senha é salva diretamente com o valor do nome do usuário em texto plano:
  ```java
  .password(userDTO.getName()) // TODO: Implementar hash de senha com BCrypt
  ```
  Além disso, no [SecurityConfig.java](file:///C:/Users/polux/OneDrive/%C3%81rea%20de%20Trabalho/Faculdade/Projeto%20Integrador/Nexus/demo/src/main/java/com/example/nexus/config/SecurityConfig.java#L34), os usuários mockados utilizam o prefixo `{noop}`, indicando ausência de hash de senha.
* **Risco:** Em caso de vazamento da base de dados, todas as senhas dos usuários estarão expostas em texto limpo.

### 🚨 Bypass Total de Segurança (Falta de Autenticação/Autorização active)
* **Onde:** [SecurityConfig.java](file:///C:/Users/polux/OneDrive/%C3%81rea%20de%20Trabalho/Faculdade/Projeto%20Integrador/Nexus/demo/src/main/java/com/example/nexus/config/SecurityConfig.java#L21-L26)
* **Detalhes:** A configuração de segurança permite o acesso público irrestrito a qualquer endpoint (`/**` marcado como `permitAll()`):
  ```java
  http
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
          .requestMatchers("/**")
          .permitAll()
          .anyRequest()
          .authenticated());
  ```
* **Risco:** Qualquer pessoa ou bot pode criar, editar ou excluir usuários, jogos e placares sem precisar de tokens ou credenciais válidas.

### 🚨 Autenticação Simulada (Mocked Authentication) no AuthController
* **Onde:** [AuthController.java](file:///C:/Users/polux/OneDrive/%C3%81rea%20de%20Trabalho/Faculdade/Projeto%20Integrador/Nexus/demo/src/main/java/com/example/nexus/controller/AuthController.java#L28-L72)
* **Detalhes:** O método `/api/auth/login` retorna dados mockados e um token simulado (`mock-access-token-{id}`) sem validar de fato a senha fornecida na requisição:
  ```java
  // Para desenvolvimento, aceita a senha se for compativel ou texto plano
  String roleStr = user.getRole() != null ? user.getRole().name().toLowerCase() : "user";
  return ResponseEntity.ok(createMockResponse(user.getId(), user.getName(), user.getEmail(), roleStr));
  ```
* **Risco:** Permite acesso sem validação real de credenciais, inutilizando o processo de login para ambientes de produção.

---

## 2. Vulnerabilidades de Média e Baixa Severidade

### ⚠️ Configuração Excessivamente Permissiva de CORS (Cross-Origin Resource Sharing)
* **Onde:** [AuthController.java](file:///C:/Users/polux/OneDrive/%C3%81rea%20de%20Trabalho/Faculdade/Projeto%20Integrador/Nexus/demo/src/main/java/com/example/nexus/controller/AuthController.java#L23) e [WebSocketConfig.java](file:///C:/Users/polux/OneDrive/%C3%81rea%20de%20Trabalho/Faculdade/Projeto%20Integrador/Nexus/demo/src/main/java/com/example/nexus/config/WebSocketConfig.java#L67)
* **Detalhes:** O uso de `@CrossOrigin(origins = "*")` e `.setAllowedOrigins("*")` permite que qualquer site externo realize requisições à sua API e conexões via WebSocket.
* **Risco:** Expõe a API a ataques como CSRF (Cross-Site Request Forgery) e sequestro de sessão se cookies forem implementados posteriormente.

### ⚠️ Ausência de Validação de Dados de Entrada (Input Validation)
* **Onde:** [UserController.java](file:///C:/Users/polux/OneDrive/%C3%81rea%20de%20Trabalho/Faculdade/Projeto%20Integrador/Nexus/demo/src/main/java/com/example/nexus/controller/UserController.java#L61) e nos demais DTOs recebidos.
* **Detalhes:** As requisições anotadas com `@RequestBody` não possuem a anotação `@Valid` do Jakarta Validation. Além disso, as classes de DTO (ex: `UserDTO`) não especificam restrições como `@NotNull`, `@Email` ou `@Size`.
* **Risco:** Entrada de dados malformados, e-mails inválidos ou ataques por injeção devido à falta de sanitização na camada de recebimento.

### ⚠️ Ausência de Proteção CSRF Desabilitada Sem Stateless Auth
* **Onde:** [SecurityConfig.java](file:///C:/Users/polux/OneDrive/%C3%81rea%20de%20Trabalho/Faculdade/Projeto%20Integrador/Nexus/demo/src/main/java/com/example/nexus/config/SecurityConfig.java#L21)
* **Detalhes:** O CSRF está desabilitado (`csrf.disable()`). Embora isso seja correto para APIs puramente REST stateless usando tokens (como JWT no Header), a API atual ainda não possui um filtro de token stateless ativo.

---

## 3. Implementações Recomendadas (Passo a Passo)

Para deixar a aplicação segura e adequada para produção, sugerimos a execução do seguinte roteiro de implementações:

### Passo A: Hashing de Senhas com BCrypt
1. **Adicionar Dependência:** Verifique se o Spring Security está configurado no `pom.xml`.
2. **Definir BCryptPasswordEncoder:** Adicione o bean do codificador de senhas na sua classe de configuração:
   ```java
   @Bean
   public PasswordEncoder passwordEncoder() {
       return new BCryptPasswordEncoder();
   }
   ```
3. **Atualizar `UserService`:** Modifique o salvamento do usuário para usar o password encoder:
   ```java
   // Injetar o PasswordEncoder
   private final PasswordEncoder passwordEncoder;

   // No método de criação de usuário
   User user = User.builder()
       .name(userDTO.getName())
       .email(userDTO.getEmail())
       .password(passwordEncoder.encode(userDTO.getPassword())) // Salvar com Hash
       .role(userDTO.getRole() != null ? userDTO.getRole() : Role.USER)
       .build();
   ```

### Passo B: Implementação de Autenticação Baseada em JWT (Stateless)
1. **Configurar Filtro JWT:** Criar um filtro personalizado (`JwtAuthenticationFilter`) que intercepte as requisições, extraia o token JWT do cabeçalho `Authorization: Bearer <token>`, valide-o e insira o usuário no contexto do Spring Security (`SecurityContextHolder`).
2. **Implementar o serviço de Geração/Validação de Tokens:** Desenvolver uma classe `JwtService` com métodos para gerar tokens JWT com tempo de expiração seguro (ex: 15 minutos para access token) e chaves secretas carregadas de variáveis de ambiente.
3. **Substituir o Mock do AuthController:** Realizar a verificação real de e-mail e senha utilizando `passwordEncoder.matches(senhaEnviada, senhaSalva)`.

### Passo C: Ajustar Filtros de Segurança no Spring Security
1. **Restringir endpoints:** Mudar as regras no [SecurityConfig.java](file:///C:/Users/polux/OneDrive/%C3%81rea%20de%20Trabalho/Faculdade/Projeto%20Integrador/Nexus/demo/src/main/java/com/example/nexus/config/SecurityConfig.java#L22-L26) para permitir acesso público apenas aos endpoints de autenticação e documentação (Swagger):
   ```java
   http
       .csrf(csrf -> csrf.disable())
       .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
       .authorizeHttpRequests(auth -> auth
           .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/ws/**").permitAll()
           .anyRequest().authenticated()
       )
       .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
   ```

### Passo D: Validação de Dados na API (Spring Validation)
1. **Adicionar dependência:**
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-validation</artifactId>
   </dependency>
   ```
2. **Definir Restrições nos DTOs:**
   ```java
   public class UserDTO {
       @NotBlank(message = "O nome é obrigatório")
       private String name;

       @NotBlank(message = "O e-mail é obrigatório")
       @Email(message = "E-mail inválido")
       private String email;

       @NotBlank(message = "A senha é obrigatória")
       @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres")
       private String password; // Adicionar o campo se necessário no DTO para criação
   }
   ```
3. **Habilitar Validação nos Controllers:**
   ```java
   @PostMapping
   public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO) { ... }
   ```
