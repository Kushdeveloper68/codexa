import crypto from "crypto";

/**
 * Generates a cryptographically random opaque token (used for teacher
 * session and student session IDs). Not a JWT on purpose — we don't need
 * client-decodable claims, and an opaque token can't be tampered with to
 * change role/permissions client-side.
 */
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Teacher tokens are stored server-side only as a salted hash, so a DB
 * compromise doesn't leak usable teacher credentials.
 */
export function hashToken(token) {
  const secret = process.env.SESSION_SECRET || "dev_secret_change_me";
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}
