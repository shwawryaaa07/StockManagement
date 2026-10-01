# ☕ Manisha Electronics — Backend API Service

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.0-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring_Security-6.4-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)](https://spring.io/projects/spring-security)
[![JWT](https://img.shields.io/badge/JWT-JJWT_0.12.6-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

Production-grade Spring Boot 3 REST API backend powering the **Manisha Electronics** retail point-of-sale and inventory system.

---

## 🏛️ Architecture & Directory Layout

```
backend/
├── .mvn/wrapper/                  # Maven wrapper binaries & properties
├── src/
│   ├── main/
│   │   ├── java/com/manishaelectronics/
│   │   │   ├── config/            # Security, database, and store configurations
│   │   │   │   ├── DatabaseConfig.java
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── ShopConfig.java
│   │   │   ├── controller/        # REST API Controllers
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── InvoiceController.java
│   │   │   │   ├── ProductController.java
│   │   │   │   ├── RootController.java
│   │   │   │   └── StaffController.java
│   │   │   ├── exception/         # Centralized error handling
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   ├── model/             # JPA Entities & Enums
│   │   │   │   ├── Invoice.java
│   │   │   │   ├── InvoiceItem.java
│   │   │   │   ├── PaymentMode.java
│   │   │   │   ├── PaymentStatus.java
│   │   │   │   ├── Product.java
│   │   │   │   ├── StaffAccount.java
│   │   │   │   └── StoreProfile.java
│   │   │   ├── repository/        # Spring Data JPA repositories
│   │   │   │   ├── InvoiceItemRepository.java
│   │   │   │   ├── InvoiceRepository.java
│   │   │   │   ├── ProductRepository.java
│   │   │   │   ├── StaffAccountRepository.java
│   │   │   │   └── StoreProfileRepository.java
│   │   │   ├── security/          # JWT Filters, Rate Limiting & Auth utilities
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   ├── JwtUtil.java
│   │   │   │   └── RateLimitingFilter.java
│   │   │   └── StockManagementApplication.java  # Application entry point
│   │   └── resources/
│   │       ├── application.properties               # Base/production config
│   │       ├── application-local.properties.example # Development template
│   │       └── application-local.properties         # Local dev secrets (GIT IGNORED)
│   └── test/
│       └── java/com/manishaelectronics/
│           ├── security/JwtUtilTest.java            # Unit tests for JWT & roles
│           └── StockManagementApplicationTests.java # Context loading tests
├── Dockerfile                     # Multi-stage production container build
├── mvnw / mvnw.cmd                # Maven Wrapper scripts (Linux/Windows)
└── pom.xml                        # Maven dependency configuration
```

---

## ⚙️ Configuration & Environment Variables

The backend uses Spring Boot configuration profiles:
- **`application.properties`**: Reads environment variables for cloud deployments (Render, Railway, AWS).
- **`application-local.properties`**: For local development. **This file is git-ignored and never committed to source control.**

### Setting Up Local Properties
```bash
# Copy the example properties template
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
```

Edit `application-local.properties` with your database credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/stockmanagement?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata
spring.datasource.username=root
spring.datasource.password=your_mysql_password

auth.jwt.secret=YourSecureDevelopmentSecretKeyThatIsAtLeast32CharactersLong2026!
auth.admin.username=admin
auth.admin.password=adminpassword
auth.admin.pin=1234
```

---

## 🚀 Running the Backend

### Prerequisites
- **Java 21 (JDK 21)** installed and set in `JAVA_HOME`.
- **MySQL 8.0+** running locally (or via Docker).

### Run with Maven Wrapper
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

The server starts on `http://localhost:8080`.

---

## 🧪 Running Tests

Execute the automated surefire test suite:
```bash
# Windows
.\mvnw.cmd test

# Linux / macOS
./mvnw test
```

---

## 🐳 Docker Build

Build and run standalone container:
```bash
docker build -t manisha-backend:latest .
docker run -p 8080:8080 --env-file ../.env manisha-backend:latest
```