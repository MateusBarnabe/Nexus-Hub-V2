# Estágio 1: Build
FROM maven:3.9.8-eclipse-temurin-17 AS builder

WORKDIR /app

# Copiar pom.xml e baixar dependências
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiar código e fazer build
COPY . .
RUN mvn clean package -DskipTests

# Estágio 2: Runtime
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copiar JAR do build anterior
COPY --from=builder /app/target/*.jar app.jar

# Expor a porta 8080
EXPOSE 8080

# Comando para iniciar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]

