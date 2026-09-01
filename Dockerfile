FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY StockManagement/pom.xml .
COPY StockManagement/src ./src
# Compile Spring Boot with permanent TiDB Cloud connection
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/StockManagement-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
