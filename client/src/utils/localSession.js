/**
 * The server's real source of truth is still the session it created
 * server-side — these localStorage copies exist so this browser tab can
 * (a) remember "I already joined room X as session Y" across a refresh,
 * and (b) actually authenticate itself on every request.
 *
 * Cross-site cookies (frontend on Vercel, backend on Render — different
 * domains) are unreliable across browsers: Chrome blocks third-party
 * cookies by default in Incognito, and this is only getting stricter
 * over time. So instead of relying solely on the httpOnly cookie the
 * server also sets, the raw session/teacher token is returned in the API
 * response body, stored here, and sent back explicitly as a header
 * (X-Student-Session / X-Teacher-Token) on every subsequent request —
 * see services/roomService.js. This works regardless of cookie policy.
 */
const KEY_PREFIX = "codeclass_session_";
const TEACHER_KEY_PREFIX = "codeclass_teacher_";
const DRAFT_PREFIX = "codeclass_draft_";

export function saveSessionLocally(roomCode, session) {
  try {
    localStorage.setItem(KEY_PREFIX + roomCode, JSON.stringify(session));
  } catch {
    // Storage unavailable (private mode, quota) — non-fatal, just skip.
  }
}

export function getLocalSession(roomCode) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + roomCode);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTeacherToken(roomCode, token) {
  try {
    localStorage.setItem(TEACHER_KEY_PREFIX + roomCode, token);
  } catch {
    // Non-fatal.
  }
}

export function getTeacherToken(roomCode) {
  try {
    return localStorage.getItem(TEACHER_KEY_PREFIX + roomCode);
  } catch {
    return null;
  }
}

export function saveDraftLocally(roomCode, questionId, code) {
  try {
    localStorage.setItem(`${DRAFT_PREFIX}${roomCode}_${questionId}`, code);
  } catch {
    // Non-fatal.
  }
}

export function getLocalDraft(roomCode, questionId) {
  try {
    return localStorage.getItem(`${DRAFT_PREFIX}${roomCode}_${questionId}`);
  } catch {
    return null;
  }
}
