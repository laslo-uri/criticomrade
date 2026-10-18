# CritiComrade

**Log it. Rate it. Argue it out.** A shared diary for films, shows, books and albums — diploma project (FTN).
Rate what you finished in half stars, follow friends, see your taste match, and challenge each other to watch, read or play something before a deadline.

**Repo:** [github.com/laslo-uri/CritiComrade](https://github.com/laslo-uri/CritiComrade)

| | |
|---|---|
| **Frontend** | Angular 21 (standalone components, signals), Tailwind CSS 3, Lucide icons |
| **Backend** | Spring Boot 3.1, Java 17, JWT, PostgreSQL, Flyway |
| **Integrations** | TMDB (films, shows, episodes), OMDb (ratings), Open Library (books), MusicBrainz and optional Spotify (albums) |
| **Languages** | English, Srpski, Magyar, Deutsch |

## Features

- Public landing page, explore, title pages, profiles and stats; sign-in only to log, follow and comment
- Diary grouped by month, half-star ratings (stored as 1–10), rewatch and spoiler flags
- Feed of people you follow with likes, comments, inline edit and delete
- Watchlist, custom public/private lists, taste profile and per-person taste match
- Follow requests for private profiles, notifications with a live unread badge
- Challenges with deadlines and points
- Dark and light themes, four languages, responsive from 320 px phones to wide desktops, keyboard and screen-reader friendly

## Demo mode (works on Vercel without the Java backend)

There are two demo paths, and both sign in with **`demo` / `criticomrade`**:

1. **Hosted demo API (`api/`).** On Vercel, `api/index.js` runs as a serverless function behind the same-origin `/api`. It mirrors the Spring Boot REST contract with a seeded, in-memory catalog (people, titles, reviews, lists, challenges, notifications). Data lasts as long as a warm instance, then the seed comes back. Optional env vars: `TMDB_API_KEY` (live films and shows), `DEMO_TOKEN_SECRET` (login tokens stay valid across instances), `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` (album art). Books use Open Library and albums MusicBrainz without a key; if an outside service is slow or down, the seed catalog is used instead.
2. **In-browser demo.** On startup the app probes `GET {apiUrl}/stats`. If nothing answers, it switches to a demo backend inside the browser, stored in `localStorage`, so every feature still works (for example `npm start` without the backend, or a static host without `api/`). *Settings → Reset demo data* restores the seed, and the password-reset code is `123456`.

Force the in-browser demo either way with `?demo=1` or `?demo=0` (remembered per browser), or set `demoMode` in `frontend/src/environments/*.ts` to `'on'`, `'off'` or `'auto'` (default). With the real Spring API reachable, both demos stay out of the way.

## Deploy to Vercel

`vercel.json` at the repo root configures everything:

1. Import the repository in Vercel. Keep the **root directory** as the repo root and leave the framework preset unset (not Angular or Vite).
2. Deploy. Vercel runs `npm ci` and the production `ng build` in `frontend/`, serves `frontend/dist/frontend/browser` with SPA routing, and runs `api/` as the demo API.

### Environment (Vercel)

All optional. The demo API vars are read at runtime; the analytics IDs are baked into the frontend at build time by `frontend/scripts/analytics-env.mjs` (run by `npm run build:vercel`).

| Variable | Used by | Purpose |
|----------|---------|---------|
| `TMDB_API_KEY` | `api/` | Live films and shows |
| `DEMO_TOKEN_SECRET` | `api/` | Login tokens stay valid across instances |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | `api/` | Album art |
| `GTM_ID` | frontend build | Google Tag Manager container (`GTM-XXXXXXX`) |
| `GA_ID` | frontend build | GA4 measurement ID (`G-XXXXXXXXXX`) |

GA4/GTM: set the ID in Vercel and redeploy. Without an ID the site ships no analytics script, no cookie banner and no footer "Cookies" link. With one, the banner asks first (Google Consent Mode v2, everything denied by default); the tag loads only after "Accept", and the choice is kept in `localStorage` (`cookie-consent`). Logic: `frontend/src/app/core/analytics/consent.ts`, `core/services/consent.service.ts`, `shared/components/cookie-consent/`.

**Use the real backend instead:** host the Spring Boot API (Render, Railway, Fly.io, a VPS…) and change the first rewrite in `vercel.json` to point at it:

```json
{ "source": "/api/:path*", "destination": "https://YOUR-BACKEND-HOST/api/:path*" }
```

The frontend calls the same-origin `/api`, so no CORS change is needed when proxying this way. If you call the backend directly instead, add your Vercel domain to `CORS_ORIGINS` in the backend `.env`.

## Local development

Prerequisites: Java 17+, Node 20.19+ (tested on Node 22), PostgreSQL with a database named `criticomrade`.

```powershell
# repo root
copy .env.example .env   # DB, JWT_SECRET, TMDB_API_KEY, OMDB_API_KEY; optional MAIL_*
git config core.hooksPath .githooks
```

**Backend** (loads `.env` from the repo root or `backend/`):

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

App: http://localhost:4200. If the backend isn't running, the frontend falls back to demo mode automatically.

## Verify

```powershell
cd backend; .\mvnw test
cd frontend; npm install; npm audit; npm run ci:local
```

Smoke test: landing → Try the demo (`demo` / `criticomrade`) → log a title (any type) → like and comment on a review → follow someone on People → add to watchlist and a list → send and accept a challenge → notifications → stats → switch theme and language.

## Layout

```
criticomrade/
├── vercel.json          Vercel build, SPA routing, /api rewrite
├── api/                 Vercel demo API (serverless, in-memory)
├── .env.example
├── backend/             Spring Boot API
└── frontend/            Angular SPA
    └── src/app/
        ├── core/        services, models, guards, interceptors, demo backend (core/demo)
        ├── shared/      layout shell, navbar, poster art, review card, dialogs…
        └── features/    landing, auth, home, explore, people, media detail, profile,
                         diary, watchlist, lists, challenges, notifications, stats, settings
```

## Brand

Constructivist-poster identity: banner red `#C8262A`, brass `#F2A93B`, darkroom `#151011`, newsprint `#F4EBE1`.
Type is Big Shoulders Display (headlines) and Instrument Sans (text), both self-hosted under the SIL Open Font License (`frontend/public/fonts`).
Titles without artwork get a generated poster in the same style (`shared/components/poster`).
