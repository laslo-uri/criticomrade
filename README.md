# CritiComrade

Social diary for films, shows, books, and albums — diploma thesis prototype (FTN).  
**Repo:** [github.com/laslo-uri/CritiComrade](https://github.com/laslo-uri/CritiComrade)

| | |
|---|---|
| **Backend** | Spring Boot 3.1, Java 17, JWT, PostgreSQL, Flyway |
| **Frontend** | Angular 21, Tailwind, standalone components |
| **Integrations** | TMDB (films, shows, episodes), OMDb (ratings), Open Library (books), MusicBrainz and optional Spotify (albums) |

Public pages (a title, a profile, reviews) can be opened without an account. Logging in is still required to rate, follow, or keep a diary. A title is stored the first time someone opens it, so explore cards and the detail page use the same record. Taste bars and a compatibility score come from overlapping ratings.

## Prerequisites

- Java 17+, Node 20+ (tested on Node 22), PostgreSQL
- Database: `criticomrade` (lowercase)

## Setup

```powershell
# repo root
copy .env.example .env   # DB, JWT_SECRET, TMDB_API_KEY, OMDB_API_KEY; optional MAIL_*
git config core.hooksPath .githooks   # strips AI co-author trailers from commits (once per clone)
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
cd frontend; npm install; npm audit; npm run ci:local
```

`npm audit` should report **0 vulnerabilities** (Dependabot scans `frontend/package-lock.json` on GitHub).

Smoke-test: register/login → explore films, shows, books, and albums → open a title → review → feed/diary → follow → watchlist → notifications → stats.

## Deploy

Vercel serves the Angular app and a same-origin demo API. The project root is this repo, not `frontend`. Leave the framework preset unset (not Angular or Vite). `vercel.json` builds the production frontend and publishes `frontend/dist/frontend/browser`.

The demo API keeps its data in memory. Reviews, follows, and lists last only as long as that warm instance, then the seed catalog comes back. Sign in with `demo` / `criticomrade`. Optional environment variables: `TMDB_API_KEY` for live films and shows, `DEMO_TOKEN_SECRET` so login tokens stay valid across instances. Books use Open Library and albums use MusicBrainz without a key. Spotify album art is used only when `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set.

Local Spring Boot and `npm start` are unchanged.

## API

REST under `/api`. OpenAPI/Swagger documents routes. Main areas: auth, users, follow, movies, reviews, comments, reactions, lists (diary/watchlist/custom), feed, recommendations, notifications, stats.

## Layout

```
criticomrade/
├── .env.example
├── api/         Vercel demo API
├── backend/     Spring Boot API
├── frontend/    Angular SPA
└── vercel.json
```
