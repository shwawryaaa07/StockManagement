# ⚛️ Manisha Electronics — Frontend POS Application

[![React](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand_5-443e38?style=for-the-badge&logo=zustand&logoColor=white)](https://zustand-demo.pmnd.rs/)
[![Zod](https://img.shields.io/badge/Validation-Zod_3.24-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

Modern, high-performance Cloud Retail POS & Inventory counter client built with React 19, featuring WhatsApp GST receipts, instant UPI QR generation, route-level code splitting, and offline resilient caching.

---

## 🏛️ Directory Layout

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── index.html                 # WCAG AA, SEO meta tags, CSP & schema.org markup
│   ├── manifest.json              # PWA manifest configuration
│   └── sw.js                      # Custom service worker for caching
├── src/
│   ├── components/                # Reusable UI & Layout Components
│   │   ├── AddProduct.js          # Product creation modal
│   │   ├── DeleteModal.js         # Confirmation dialog modal
│   │   ├── EditProduct.js         # Product update modal
│   │   ├── EmptyState.js          # Reusable zero-data illustration
│   │   ├── FloatingButton.js      # Quick-action shortcut button
│   │   ├── Navbar.js              # Header navigation & theme toggle
│   │   ├── OfflineBanner.js       # Real-time network monitor banner
│   │   ├── QRCodeDisplay.js       # Dynamic BharatQR/UPI QR code generator
│   │   ├── ServerWakeupBanner.js  # Free-tier backend cold-start indicator
│   │   ├── SkeletonLoader.js      # Granular loading placeholder skeletons
│   │   ├── index.js               # Clean barrel export for components
│   │   └── __tests__/             # Component unit tests
│   ├── context/                   # Global React contexts (Auth, Toast notifications)
│   ├── hooks/                     # Custom React hooks (Inactivity timeout lock)
│   ├── pages/                     # Full Route Screen Views
│   │   ├── CreateInvoice.js       # 10-Second Turbo POS counter & billing
│   │   ├── Dashboard.js           # Real-time business metrics & sales summaries
│   │   ├── DueInvoices.js         # Outstanding balances & customer ledger
│   │   ├── EditInvoice.js         # Modify items and invoice status
│   │   ├── InvoiceDetail.js       # Tax invoice viewer, print & WhatsApp share
│   │   ├── InvoiceList.js         # Filterable invoice history
│   │   ├── Login.js               # Multi-mode access (Owner, Staff, Visitor Demo)
│   │   ├── Login.css              # Glassmorphism login screen styles
│   │   ├── ProductList.js         # Catalog manager with stock tracking
│   │   ├── StaffManagement.js     # Role & access control manager
│   │   └── index.js               # Clean barrel export for page routes
│   ├── schemas/                   # Zod runtime validation schemas
│   ├── services/                  # Axios HTTP client, Demo adapters & UPI generator
│   ├── store/                     # Zustand state management (Cart & Auth stores)
│   ├── utils/                     # Financial calculations, sanitization & receipts
│   ├── App.js                     # Root routing, route lazy-loading & auth protection
│   ├── index.js                   # Application bootstrap & PWA service worker registration
│   ├── setupTests.js              # Jest DOM testing setup
│   └── styles.css                 # Curated custom CSS design system
├── .env.example                   # Environment configuration template
├── package.json                   # Project dependencies and npm scripts
└── vercel.json                    # Edge SPA rewrite rules
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

Contents of `.env`:
```env
# Backend API Base URL
# Local Spring Boot: http://localhost:8080/api
# Production Cloud:  https://your-backend.onrender.com/api
REACT_APP_API_URL=http://localhost:8080/api
```

> **Note:** `.env` and `.env.production` are strictly git-ignored to prevent credential leaks.

---

## 🚀 Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm test`
Launches the Jest test runner across unit and integration tests:
```bash
npm test -- --watchAll=false
```

### `npm run build`
Compiles an optimized production build into the `build/` directory with gzip compression and chunk hashing.
