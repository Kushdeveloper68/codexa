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
- Classroom creator is automatically also a participant (no redundant re-join step)
- Classroom: live code sync (debounced/throttled broadcast), live language switcher with starter snippets per language, real-time chat, presence
- Test room: questions, server-authoritative timer, debounced autosave, **Run Code** (sandboxed execution — self-hosted Piston or JDoodle, see below), submit with confirmation
- Teacher dashboard: real-time student table with **per-type warning breakdown** (not just a count), student detail slide-over with full activity timeline, live **Code Runs** feed showing what each student ran and its output, live activity feed — 5s polling fallback on top of sockets so it never goes stale
- Anti-cheat activity monitoring: fullscreen exit, page visibility, multi-tab detection (BroadcastChannel), and **copy/paste/cut detection wired directly into the Monaco editor** (`editor.onDidPaste` + capture-phase copy/cut listeners on the editor's DOM node — more reliable than a generic `document` listener, which Monaco's internal clipboard handling can bypass). All reported as neutral "activity detected" signals, never labeled as cheating; teacher makes the final call
- Reconnection handling: 8s grace period before a student is marked `DISCONNECTED`, local draft cache so in-progress code survives a refresh or network blip
- Results view: submission status + submitted code, no fabricated scores
- Security: Helmet, CORS, rate limiting (including a tighter limiter on code execution), zod validation on every mutating endpoint, mongo-sanitize, server-side permission checks on every teacher/student action

### Run Code — how it actually executes

This server **never runs student code itself** (no `eval()`, no `child_process`). That's a deliberate security boundary: safely sandboxing arbitrary untrusted code needs real CPU/memory limits, filesystem isolation, and no network access — getting that wrong turns "Run Code" into a remote-code-execution hole in your server.

Instead, `POST /api/test/:code/run` proxies to an external sandboxed execution provider, chosen via `CODE_EXEC_PROVIDER` in `server/.env`:

**Option A — self-hosted Piston (recommended: free forever, no key, no card, no rate limit)**

As of Feb 2026, [Piston](https://github.com/engineer-man/piston)'s public demo API is whitelist-only, so you run your own instance:

```bash
git clone https://github.com/engineer-man/piston
cd piston/docker-compose
docker compose up -d
```

Then in `server/.env`:
```
CODE_EXEC_PROVIDER=piston
PISTON_URL=http://localhost:2000/api/v2/piston
```

**Option B — JDoodle (no self-hosting, free signup, no card on their free tier)**

Sign up at [jdoodle.com/compiler-api](https://www.jdoodle.com/compiler-api) with just an email, grab your Client ID/Secret from the dashboard, then in `server/.env`:
```
CODE_EXEC_PROVIDER=jdoodle
JDOODLE_CLIENT_ID=your_client_id
JDOODLE_CLIENT_SECRET=your_client_secret
```
Free tier is capped at 200 executions/day — fine for a classroom, not for large-scale use. (Third-party services change their terms over time — double-check at signup that no card is required before proceeding.)

Without either configured, "Run Code" returns a clean error to the student ("Code execution isn't configured yet") and logs the exact reason to your server console — everything else in the app still works.

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
