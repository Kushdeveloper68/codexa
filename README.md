# CodeClass

Temporary room-based platform for college coding labs — Classroom collaboration and Teacher-controlled practical tests. No login required for teachers or students.

## Architecture

```
server/   Express + MongoDB + Socket.IO API
client/   React + Vite + Tailwind frontend
```

See `server/README` inline comments and controllers for the REST API surface, and `server/sockets/index.js` for the Socket.IO event contract.

## Prerequisites

- Node.js 18+
- A MongoDB connection string. Easiest options:
  - **MongoDB Atlas free tier** (recommended — you likely have this free via GitHub Student Developer Pack)
  - Local `mongod` if you have it installed

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env
# edit .env: set MONGODB_URI to your connection string, and SESSION_SECRET to a random string
npm install
npm run dev
```

Server starts on `http://localhost:5000`. Health check: `GET /api/health`.

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Client starts on `http://localhost:5173`.

## What's implemented (MVP slice)

- Room creation (Test + Classroom), server-authoritative room codes, TTL-based expiration
- No-login sessions: teacher gets an httpOnly cookie token scoped to the room; students get an httpOnly session cookie — the room code alone never grants teacher control
- Student join flow (name + optional roll number, no account)
- Test room: questions, server-authoritative timer (`testStartedAt`/`testEndsAt`), debounced autosave, submit with confirmation
- Teacher dashboard: real-time student table, live summary cards, live activity feed — all driven by actual DB state via Socket.IO, nothing hardcoded
- Anti-cheat activity monitoring: fullscreen exit, page visibility, paste/copy/cut, multi-tab detection (via BroadcastChannel) — all reported as neutral "activity detected" signals, never labeled as cheating; teacher makes the final call
- Classroom: live code sync (debounced/throttled broadcast) + real-time chat + presence
- Reconnection handling: 8s grace period before a student is marked `DISCONNECTED`, local draft cache so in-progress code survives a refresh or network blip
- Results view: submission status + submitted code, no fabricated scores
- Security: Helmet, CORS, rate limiting, zod validation on every mutating endpoint, mongo-sanitize, server-side permission checks on every teacher/student action (never trusts a client-declared role)

## What's next (not yet built)

- Question randomization, multiple-file editors, automatic evaluation — deliberately deferred per the MVP spec, architecture leaves room for them
- Static pages (about/features/privacy/terms/404 content — routing exists, content is minimal)
- Production deployment config (Docker, process manager, etc.)
- Automated test suite

## Notes on verification

This was built and syntax/build-checked in a sandboxed environment without network access to a real MongoDB instance, so:
- The server was confirmed to boot cleanly and load all routes/middleware/models (verified by intentionally attempting to connect — it fails only at the Mongo connection step, which is expected without a live DB)
- The client was confirmed to build cleanly with Vite (`npm run build` succeeds, no compile errors)
- Full end-to-end runtime behavior (actually creating a room, joining, live socket events) has **not** been exercised against a live database — please run `npm run dev` on both sides with a real `MONGODB_URI` and walk through the flows before relying on this in production. If something breaks in that first real run, tell me what you see and I'll fix it.
