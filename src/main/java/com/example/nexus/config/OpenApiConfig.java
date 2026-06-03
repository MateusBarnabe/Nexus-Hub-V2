package com.example.nexus.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuracao central do OpenAPI/Swagger para a API Nexus Score.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI nexusOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("Nexus Score API")
                .description("Documentacao da API do Hub de Jogos Nexus Score")
                .version("v1")
                .contact(new Contact().name("Nexus Score Team"))
                .license(new License().name("Uso academico")));
    }
}

