import StudentSession from "../models/StudentSession.js";
import { UnauthorizedError } from "../utils/errors.js";
import { asyncHandler } from "../utils/errors.js";

/**
 * Requires req.room to already be resolved. Identifies the student from
 * either:
 *   1. an `X-Student-Session` header (primary) — sent explicitly by the
 *      client from a token it stored after joining, or
 *   2. the `student_<code>` httpOnly cookie (fallback) — convenient for
 *      local dev where frontend/backend share a site, but unreliable in
 *      production: browsers increasingly block cross-site cookies by
 *      default (Chrome Incognito already does), which breaks cookie auth
 *      whenever the frontend and backend are on different domains (e.g.
 *      Vercel + Render). The header path sidesteps that entirely.
 *
 * Either way, this is what proves "this request is really from the
 * student who joined" without requiring any account/password.
 */
export const requireStudent = asyncHandler(async (req, res, next) => {
  const sessionId =
    req.headers["x-student-session"] || req.cookies?.[`student_${req.room.code}`];

  if (!sessionId) throw UnauthorizedError("Student session required");

  const session = await StudentSession.findOne({
    roomId: req.room._id,
    sessionId,
  });

  if (!session) throw UnauthorizedError("Invalid student session");

  req.studentSession = session;
  next();
});
