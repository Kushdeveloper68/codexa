import rateLimit from "express-rate-limit";

// Room creation is a heavier action (writes many docs) - keep it tight.
export const createRoomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many rooms created. Try again later." } },
});

// Joining is cheap but should still be throttled to slow down brute-forcing
// room codes.
export const joinRoomLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many join attempts. Slow down." } },
});

// Execution hits an external paid/rate-limited service, so keep this
// tighter than general API traffic — enough for iterative debugging
// without allowing a tight loop to hammer the free execution service.
export const runCodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many runs. Wait a moment before running again." } },
});

// General API traffic ceiling.
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
