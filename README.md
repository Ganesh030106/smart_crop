# Smart Crop Advisor (B2G Project)

![Smart Crop Advisor Banner](https://via.placeholder.com/800x200.png?text=Smart+Crop+Advisor)

Smart Crop Advisor is an AI-powered crop advisory platform built for rainfed smallholder farmers in India. The platform focuses on sustainable land management, aligning with **UN SDG-15**.

## 🏗️ Architecture

- **Frontend**: React 19 + Vite + React Router (PWA ready with Service Worker)
- **Backend**: Node.js + Express (REST API)
- **Database**: PostgreSQL (hosted on Neon) with Sequelize ORM

## 🚀 Features

- **Auth & Profiles**: JWT-based authentication with role-based access (Farmers & Admins).
- **Advisories**: Region, crop, and category-specific advice delivered to farmers.
- **Alerts**: Real-time alerts for weather, pests, and market prices.
- **Logs & Soil Health**: Farmers can track fertilizer usage and soil health metrics.
- **AI Planning**: Crop recommendation sessions based on land size, soil type, and weather.
- **Offline Support**: PWA with offline fallback caching.

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js v18+
- PostgreSQL database (or use the provided Neon DB credentials for testing)

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on .env.example
npm run start
```
*Note: The backend runs on `http://localhost:5000` by default.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Note: The frontend runs on `http://localhost:5173` by default and proxies `/api` to the backend.*

### 4. Database Seeding (Demo Data)
To populate the database with demo farmers, advisories, alerts, and logs:
```bash
node seed.js
```

## 📦 Production Deployment

The project is configured for seamless deployment on **Render**.

1. Connect your GitHub repository to Render.
2. Create a new **Web Service**.
3. Use the following settings (defined in `render.yaml`):
   - **Build Command**: `cd frontend && npm ci && npm run build && cd ../backend && npm ci`
   - **Start Command**: `node backend/server.js`
4. Set the necessary environment variables in the Render dashboard:
   - `DATABASE_URL`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - (`JWT_SECRET` is auto-generated)

## 🔒 Security Enhancements (Completed)
- `helmet` implemented for HTTP security headers.
- `express-rate-limit` applied to auth and general API routes.
- CORS restricted to allowed frontend origins via environment variables.
- Sensitive credentials removed from codebase.
- Development-only database schema alterations (`sync({ alter: true })`) disabled in production.

## 📝 License
This project is developed for the Build2Gether (B2G) initiative.
