# CritiComrade

Social movie reviews and lists — diploma thesis prototype (FTN).  
**Repo:** [github.com/laslo-uri/CritiComrade](https://github.com/laslo-uri/CritiComrade)

| | |
|---|---|
| **Backend** | Spring Boot 3.1, Java 17, JWT, PostgreSQL, Flyway |
| **Frontend** | Angular 18, Tailwind, standalone components |
| **Integrations** | TMDB & OMDb (proxied; API keys via `.env`) |

## Prerequisites

- Java 17+, Node 18+, PostgreSQL
- Database: `criticomrade` (lowercase)

## Setup

```powershell
# repo root
copy .env.example .env   # DB, JWT_SECRET, TMDB_API_KEY, OMDB_API_KEY; optional MAIL_*
```

**Backend** — loads `.env` from repo root (or `backend/`):

```powershell
cd backend
.\mvnw spring-boot:run
```

| Service | URL |
|---------|-----|
| API | http://localhost:8080/api |
| Swagger | http://localhost:8080/swagger-ui |

**Frontend:**

```powershell
cd frontend
npm install
npm start
```

App: http://localhost:4200

## Verify

```powershell
cd backend; .\mvnw test
cd frontend; npm run build
```

Smoke-test: register/login → popular movies → review → feed/diary → follow → watchlist → notifications.

## API

REST under `/api`. OpenAPI/Swagger documents routes. Main areas: auth, users, follow, movies, reviews, comments, reactions, lists (diary/watchlist/custom), feed, recommendations, notifications, stats.

## Layout

```
criticomrade/
├── .env.example
├── backend/     Spring Boot API
└── frontend/    Angular SPA
```
