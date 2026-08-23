# Codexa

**A temporary, no-login, room-based coding platform for college labs — live collaborative classrooms and teacher-run programming practicals.**

Built for the everyday college lab problem: one student writes code and wants to share it with classmates, without screenshots, WhatsApp, or logging into anything. Create a room, get a short code, share it, and everyone's in — instantly.

---

## What it does

Codexa has two modes built on the same underlying "room" system:

### 🧑‍🏫 Classroom
A live, shared coding space for a lab session or study group.
- One shared code editor, synced in real time across everyone in the room
- Live group chat
- See who's online, who just joined, who disconnected
- Switch the editor's language on the fly (with a starter snippet per language)
- No accounts — join with just a name and the room code

### 📝 Test Room
A teacher-run practical exam environment.
- Teacher creates a test with a title, language, duration, and questions in under a minute
- Students join with name + roll number (no account, no password)
- Server-authoritative timer — a student can't extend their own time by editing anything client-side
- Code autosaves as students type (debounced, not on every keystroke)
- Students can **actually run their code** and see real output before submitting
- Teacher gets a **live dashboard**: who's joined, who's writing, who's submitted, and a running activity feed
- Built-in activity monitoring (see below) — flagged neutrally, teacher makes the call
- Results view shows submission status and submitted code (no fabricated auto-grading)

### The core idea: no login, ever
Teachers and students never create accounts. A teacher gets a secure, temporary session tied to the room they created (via an httpOnly cookie) — the room code alone never grants teacher control. Students get their own lightweight session the moment they join. Everything expires with the room.

---

## How it works

### Architecture

```
client/   React + Vite + Tailwind — the UI
server/   Express + MongoDB + Socket.IO — the API and real-time layer
```

Everything revolves around a generic **Room** entity (`type: CLASSROOM | TEST`), so the same room/session/expiration machinery powers both modes instead of being two separate systems bolted together.

### No-login sessions, explained
- **Room code** — a short, human-friendly code (ambiguous characters like `0/O`, `1/I/L` excluded) that lets anyone *join* a room.
- **Teacher session** — a separate, cryptographically random token issued only to the room's creator, stored as an **httpOnly cookie** scoped to that room. Every teacher-only action (start test, end test, view dashboard) is checked against this token server-side. A student who knows the room code has no way to forge it.
- **Student session** — issued the moment a student joins, also an httpOnly cookie. This is what lets a student's autosaved code, submission, and activity history all tie back to *them* specifically — without ever asking for a password.

Sessions are never trusted from client-declared data (e.g. a request body claiming `role: "teacher"` is ignored — the server only trusts what the cookie proves).

### Real-time layer (Socket.IO)
Every room gets its own Socket.IO room (`room:<code>`). Both the classroom editor/chat and the test dashboard/activity-feed are driven by real socket events, not polling-only:

```
room:join            code:update          chat:message
student:joined        student:started      student:submitted
student:disconnected  student:reconnected  activity:event
test:start            test:end             code:run
```

The teacher dashboard also polls every few seconds as a safety net, so it never silently goes stale even if a socket event is ever missed.

### Run Code — how it actually executes
The server **never executes student code itself** — no `eval()`, no `child_process`. Running arbitrary untrusted code safely requires a real sandbox (CPU/memory limits, filesystem isolation, no network access), and getting that wrong turns a "Run Code" button into a remote-code-execution hole in your own server.

Instead, code execution is proxied to an external sandboxed provider, configurable via `CODE_EXEC_PROVIDER` in `server/.env`:
- **Piston** (self-hosted via Docker — free forever, no key, no card)
- **JDoodle** (hosted, free signup, 200 executions/day on the free tier)

See `server/.env.example` for exact setup steps for either.

### Anti-cheat activity monitoring
During a test, the client watches for browser-level signals — fullscreen exit, tab switching (`visibilitychange`), copy/paste/cut inside the editor (hooked directly into Monaco's own clipboard events for reliability), and multiple tabs open at once (via `BroadcastChannel`). Every signal is:
- Reported to the server, which decides severity — the client can't inflate or suppress its own warning count
- Shown to the teacher as neutral language ("Fullscreen exited", "Activity detected") — **never** as an accusation
- Broken down by type in the teacher dashboard (not just a single opaque number), with a full timestamped history per student

The system is explicit about its limits: no browser-based tool can reliably see another monitor, another device, or guarantee a student isn't using an AI tool elsewhere. This is deterrence + logging + teacher visibility — not a claim of being cheat-proof.

### Reconnection & resilience
- An 8-second grace period before a disconnected student is marked `DISCONNECTED`, so a page refresh or brief network blip doesn't visibly flag them
- In-progress code is cached locally so it survives a reload even before the next autosave lands
- The test timer is server-authoritative (`testStartedAt` / `testEndsAt` stored in the DB), so it can't be manipulated by pausing JavaScript or changing the system clock

---

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Socket.IO client, Monaco Editor |
| Backend | Node.js, Express, MongoDB (Mongoose), Socket.IO |
| Security | Helmet, CORS, rate limiting, Zod validation, mongo-sanitize, httpOnly session cookies |
| Code execution | Piston (self-hosted) or JDoodle — proxied, never run in-process |

---

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier works well)

### 1. Backend
```bash
cd server
cp .env.example .env
# edit .env — set MONGODB_URI, SESSION_SECRET, and a code execution provider
npm install
npm run dev
```
Runs on `http://localhost:5000`. Health check: `GET /api/health`.

### 2. Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Runs on `http://localhost:5173`.

### 3. Code execution (optional but recommended)
"Run Code" needs one provider configured — see the comments in `server/.env.example` for both the self-hosted Piston path and the JDoodle free-signup path. Without either, everything else in the app still works; Run Code just returns a clean "not configured" message.

---

## Project structure

```
server/
├── controllers/     # request handlers
├── models/          # Mongoose schemas (Room, StudentSession, TeacherSession, Question, Submission, ActivityEvent, ChatMessage)
├── routes/          # REST endpoints
├── middleware/       # auth, validation, rate limiting, error handling
├── sockets/          # Socket.IO event handlers
├── services/         # external integrations (code execution)
└── utils/

client/src/
├── components/       # reusable UI (editor panel, status badges, activity feed, chat, etc.)
├── pages/            # one file per screen/route
├── hooks/             # socket connection, debouncing, activity monitoring
├── services/          # API client
├── socket/            # Socket.IO client singleton
└── constants/          # language snippets, activity event metadata
```

---

## What's not built yet

- Automatic code evaluation / scoring (results show submission status + code, intentionally no fabricated grades)
- Multiple files per submission, student-specific workspaces
- Static content pages (about/privacy/terms — routes exist, copy is minimal)
- Automated test suite
- Production deployment config

The architecture is built so these can be added without a rewrite (the `Room` model already supports a generic `type`, ready for future room kinds beyond `CLASSROOM`/`TEST`).

---

## Contributing

Contributions are welcome — bug fixes, responsive/UI polish, new features, or docs improvements.

1. Fork the repo and create a branch off `main`
2. Keep changes focused — one logical change per PR is easier to review than a bundle of unrelated ones
3. Match the existing patterns: controllers stay thin, validation happens via Zod schemas in `server/utils/validation.js`, and the server never trusts client-declared permissions
4. Test both the REST flow and the Socket.IO flow if your change touches real-time behavior
5. Open a PR with a clear description of what changed and why

If you're adding a new room type or a new anti-cheat signal, please keep the same philosophy this project already follows: no fake functionality, no client-trusted permissions, and no accusatory language toward students — the teacher always makes the final call.

---

## Author

Built by **Kush** ([kushdeveloper.me](https://kushdeveloper.me))

---

## License

Not yet licensed — add a `LICENSE` file before distributing or accepting external contributions under specific terms.