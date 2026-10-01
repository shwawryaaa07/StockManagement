# ==============================================================================
# Multi-Stage Dockerfile for Spring Boot Backend (Root Context)
# Compatible with Docker Compose and Cloud Container Platforms (Render, etc.)
# ==============================================================================

# Stage 1: Build JAR package
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies layer
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source and build
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal JRE Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app

# Non-root user setup for security hardening
RUN useradd -m -u 1001 appuser
USER appuser

COPY --from=build --chown=appuser:appuser /app/target/StockManagement-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
