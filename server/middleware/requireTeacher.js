import TeacherSession from "../models/TeacherSession.js";
import { hashToken } from "../utils/tokens.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import { asyncHandler } from "../utils/errors.js";

/**
 * Requires req.room to already be resolved (see resolveRoom middleware).
 * Reads the teacher token from an httpOnly cookie scoped to this room and
 * verifies it belongs to req.room. A student who only knows the room code
 * has no way to produce a valid cookie here — the room code alone never
 * grants teacher control.
 */
export const requireTeacher = asyncHandler(async (req, res, next) => {
  const cookieName = `teacher_${req.room.code}`;
  const token = req.cookies?.[cookieName];

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
