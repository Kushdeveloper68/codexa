/**
 * The student's actual auth is the httpOnly session cookie set by the
 * server on join — this localStorage copy exists purely so the browser
 * tab can remember "I already joined room X as session Y" across a
 * refresh, and so unsent code survives a network blip until it can be
 * autosaved to the server. It is never trusted as an auth credential.
 */
const KEY_PREFIX = "codeclass_session_";
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
