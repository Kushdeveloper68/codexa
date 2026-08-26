import TeacherSession from "../models/TeacherSession.js";
import { hashToken } from "../utils/tokens.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import { asyncHandler } from "../utils/errors.js";

/**
 * Requires req.room to already be resolved (see resolveRoom middleware).
 * Identifies the teacher from either:
 *   1. an `X-Teacher-Token` header (primary) — sent explicitly by the
 *      client from a token it stored after creating the room, or
 *   2. the `teacher_<code>` httpOnly cookie (fallback) — works for local
 *      dev, but unreliable in production where the frontend and backend
 *      sit on different domains: browsers increasingly block cross-site
 *      cookies outright (Chrome Incognito already does by default), which
 *      breaks cookie-only auth for any split-domain deployment.
 *
 * Either way, a student who only knows the room code has no way to
 * produce a valid token/cookie here — the room code alone never grants
 * teacher control. The token itself is still hashed at rest (see
 * TeacherSession model), so a DB leak doesn't hand out usable tokens.
 */
export const requireTeacher = asyncHandler(async (req, res, next) => {
  const token = req.headers["x-teacher-token"] || req.cookies?.[`teacher_${req.room.code}`];

  if (!token) throw UnauthorizedError("Teacher session required");

  const tokenHash = hashToken(token);
  const session = await TeacherSession.findOne({
    roomId: req.room._id,
    tokenHash,
  });

  if (!session) throw ForbiddenError("Invalid teacher session for this room");

  req.teacherSession = session;
  next();
});
