<div align="center">
  <h1>📦 Manisha Electronics — Cloud Retail POS & ERP</h1>
  <p><strong>Enterprise-Grade Point of Sale, Real-Time Inventory Control & Automated WhatsApp GST Invoicing</strong></p>

  <p>
    <a href="https://stock-management-xi-six.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-Vercel_Edge-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
    <a href="https://stockmanagement07.onrender.com/api/products"><img src="https://img.shields.io/badge/API_Service-Render_Cloud-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render Cloud" /></a>
    <a href="https://github.com/shwawryaaa07/StockManagement"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" /></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white" alt="Java 21" />
    <img src="https://img.shields.io/badge/Spring_Boot-3.4.0-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot 3" />
    <img src="https://img.shields.io/badge/Spring_Security-6.4-6DB33F?style=flat-square&logo=springsecurity&logoColor=white" alt="Spring Security" />
    <img src="https://img.shields.io/badge/JWT-JJWT_0.12.6-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
    <img src="https://img.shields.io/badge/React-19.2-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/MySQL-8.4-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL 8.4" />
    <img src="https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

---

## 📖 Executive Summary

**Manisha Electronics** is a full-stack, cloud-native Point-of-Sale (POS) and Enterprise Resource Planning (ERP) platform engineered for electronics retailers. Built with modern software architecture principles, it segregates into an immutable **Spring Boot 3** REST API backend and an ultra-responsive **React 19** Single Page Application (SPA).

Key business capabilities include 10-second Turbo checkout, dynamic BharatQR / UPI payment collection, one-click formatted WhatsApp tax invoices, live customer credit ledgers, and role-based access control (RBAC).

---

## 🏛️ Monorepo File Architecture & Segregation

The repository follows a clean, decoupled monorepo structure separating frontend client, backend service, and root orchestration:

```
StockManagement/
├── .editorconfig                  # Universal cross-IDE code formatting standard
├── .env.example                   # Master backend & database environment template
├── .gitattributes                 # Line-ending normalization (LF for scripts, CRLF for batch)
├── .gitignore                     # Monorepo-wide security & ignore filters
├── Dockerfile                     # Multi-stage production container build (Root context)
├── docker-compose.yml             # Local orchestration: MySQL 8.4 + Backend + Frontend
├── vercel.json                    # Edge routing fallback configuration
├── README.md                      # System documentation (This file)
│
├── backend/                       # ☕ Spring Boot 3 & Java 21 REST API
│   ├── .gitattributes
│   ├── .gitignore                 # Backend-specific ignore rules (secrets & logs)
│   ├── Dockerfile                 # Standalone backend container build
│   ├── mvnw / mvnw.cmd            # Maven Wrapper
│   ├── pom.xml                    # Clean Maven POM with explicit dependencies
│   ├── README.md                  # Dedicated backend developer documentation
│   └── src/
│       ├── main/
│       │   ├── java/com/manishaelectronics/
│       │   │   ├── config/        # Security, Database, Shop metadata beans
│       │   │   ├── controller/    # REST Endpoints (Auth, Products, Invoices, Staff)
│       │   │   ├── exception/     # Centralized error handler (@ControllerAdvice)
│       │   │   ├── model/         # JPA Entities & Enums
│       │   │   ├── repository/    # Spring Data JPA interfaces
│       │   │   ├── security/      # JWT authentication, Rate limiting, Filter chains
│       │   │   └── StockManagementApplication.java
│       │   └── resources/
│       │       ├── application.properties               # Base config & env variable bindings
│       │       ├── application-local.properties.example # Local development template
│       │       └── application-local.properties         # Local dev secrets (GIT IGNORED)
│       └── test/                  # Automated JUnit 5 & Mockito test suite
│
└── frontend/                      # ⚛️ React 19 Client Application
    ├── .env.example               # Frontend environment template
    ├── .gitignore                 # Frontend-specific ignore rules (builds & envs)
    ├── package.json               # Dependencies & build scripts
    ├── vercel.json                # SPA rewrite rules for client routing
    ├── README.md                  # Dedicated frontend developer documentation
    ├── public/                    # PWA Manifest, SEO meta tags, CSP & icons
    └── src/
        ├── components/            # Reusable UI & Layout Components
        │   ├── AddProduct.js      # Modal: Add catalog item
        │   ├── DeleteModal.js     # Modal: Confirmation dialog
        │   ├── EditProduct.js     # Modal: Edit catalog item
        │   ├── EmptyState.js      # Zero-data feedback component
        │   ├── FloatingButton.js  # Quick-action shortcut button
        │   ├── Navbar.js          # Navigation bar with role badge & theme toggle
        │   ├── OfflineBanner.js   # Real-time network monitor banner
        │   ├── QRCodeDisplay.js   # Dynamic UPI QR generator
        │   ├── ServerWakeupBanner.js # Free-tier backend cold-start indicator
        │   ├── SkeletonLoader.js  # Granular loading placeholder skeletons
        │   ├── index.js           # Components barrel export
        │   └── __tests__/         # Component unit tests
        ├── pages/                 # Route Screen Views (Lazy-Loaded)
        │   ├── CreateInvoice.js   # 10-Second Turbo POS counter & billing
        │   ├── Dashboard.js       # Real-time sales KPIs & metrics
        │   ├── DueInvoices.js     # Pending customer balances & credit ledger
        │   ├── EditInvoice.js     # Invoice modification & recalculation
        │   ├── InvoiceDetail.js   # Tax invoice viewer, print & WhatsApp share
        │   ├── InvoiceList.js     # Searchable invoice ledger
        │   ├── Login.js           # Multi-mode access (Owner, Staff, Visitor Demo)
        │   ├── Login.css          # Glassmorphism login screen styles
        │   ├── ProductList.js     # Product catalog & inventory manager
        │   ├── StaffManagement.js # RBAC staff credential manager
        │   └── index.js           # Pages barrel export
        ├── context/               # Auth & Toast notification providers
        ├── hooks/                 # Custom React hooks (30-min inactivity session lock)
        ├── schemas/               # Zod runtime validation schemas
        ├── services/              # Axios API client, Demo data adapters & UPI services
        ├── store/                 # Zustand state stores (Cart & Auth)
        ├── utils/                 # Billing calculations, sanitization & receipt formatters
        ├── App.js                 # App root with code-split routing & session guards
        ├── index.js               # Application bootstrap
        ├── setupTests.js          # Jest DOM configuration
        └── styles.css             # Design tokens, variables & custom styles
```

---

## 🔒 Security & Git Protection

The repository enforces strict security boundaries to prevent credential leakage:

1. **Environment Files Protection**:
   - `.env`, `.env.*`, `*.local`, and `application-local.properties` are blocked by `.gitignore`.
   - Production secrets are **never** committed to version control.
   - Clean, self-documenting templates (`.env.example`, `frontend/.env.example`, `backend/src/main/resources/application-local.properties.example`) are provided for team onboarding.
2. **Access Control & Password Security**:
   - Admin Master PIN and Staff PINs are protected using BCrypt hashing and constant-time string comparisons to prevent timing attacks.
   - Stateless authentication via HMAC-SHA256 Signed JSON Web Tokens (JJWT 0.12.6).
   - In-memory rate-limiting filter prevents brute-force login attempts.
3. **Data Integrity & XSS Prevention**:
   - Strict Content Security Policy (CSP) headers.
   - Runtime sanitization with DOMPurify to prevent stored XSS attacks.
   - Input validation schemas powered by Zod.

---

## 🚀 Quick Start Guide

### Option 1: Docker Compose (Full-Stack Automated)
Clone the repository and run the full stack with one command:
```bash
# 1. Clone repository
git clone https://github.com/shwawryaaa07/StockManagement.git
cd StockManagement

# 2. Configure environment
cp .env.example .env

# 3. Spin up MySQL, Backend & Services
docker-compose up -d --build
```
The Backend API will be available at `http://localhost:8080` and MySQL at `localhost:3306`.

---

### Option 2: Local Development Setup

#### 1. Backend Setup
```bash
cd backend

# Create local properties from example
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties

# Run backend with Maven Wrapper
.\mvnw.cmd spring-boot:run     # Windows
./mvnw spring-boot:run        # Linux / macOS
```
Backend runs on `http://localhost:8080`.

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create local env configuration
cp .env.example .env

# Start React development server
npm start
```
Frontend runs on `http://localhost:3000`.

---

## 🧪 Testing & Verification

Both subprojects contain automated test suites:

- **Backend Tests (JUnit 5 & Mockito)**:
  ```bash
  cd backend && .\mvnw.cmd test
  ```
  Validates JWT expiration, token claims, role-based authorization fallback, and database schema mappings.

- **Frontend Tests (Jest & React Testing Library)**:
  ```bash
  cd frontend && npm test -- --watchAll=false
  ```
  Validates 72 unit tests across financial calculation engines, Zod validation schemas, Zustand stores, DOM sanitizers, and receipt formatters.

---

## 👨‍💻 Author & Maintainer

<div align="center">
  <h3>Shaurya Narayan Gawas</h3>
  <p><strong>Computer Engineering Student | Full-Stack Java Developer | Cloud & 3D Tech Enthusiast</strong></p>

  <p>
    <a href="https://linkedin.com/in/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
    <a href="mailto:gawasshaurya076@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email" /></a>
    <a href="https://stock-management-xi-six.vercel.app"><img src="https://img.shields.io/badge/Portfolio_Project-000000?style=flat-square&logo=vercel&logoColor=white" alt="Portfolio" /></a>
  </p>
</div>

---

## 📄 License

This repository is maintained for educational and commercial enterprise demonstration purposes.
