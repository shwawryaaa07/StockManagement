package com.manishaelectronics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class StockManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(StockManagementApplication.class, args);
	}

	// ====== CORS CONFIGURATION ======
	// This allows React (localhost:3000) to talk to Spring Boot (localhost:8080)
	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/**")  // Allow all endpoints
						.allowedOrigins("http://localhost:3000")  // Allow React app
						.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // Allow these methods
						.allowedHeaders("*")  // Allow all headers
						.allowCredentials(true);  // Allow cookies/auth
			}
		};
	}
}