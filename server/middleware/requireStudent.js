import StudentSession from "../models/StudentSession.js";
import { UnauthorizedError } from "../utils/errors.js";
import { asyncHandler } from "../utils/errors.js";

/**
 * Requires req.room to already be resolved. Reads the student's opaque
 * sessionId from an httpOnly cookie scoped to this room. This is what
 * proves "this request is really from the student who joined" without
 * requiring any account/password.
 */
export const requireStudent = asyncHandler(async (req, res, next) => {
  const cookieName = `student_${req.room.code}`;
  const sessionId = req.cookies?.[cookieName];

  if (!sessionId) throw UnauthorizedError("Student session required");

  const session = await StudentSession.findOne({
    roomId: req.room._id,
    sessionId,
  });

  if (!session) throw UnauthorizedError("Invalid student session");

  req.studentSession = session;
  next();
});
