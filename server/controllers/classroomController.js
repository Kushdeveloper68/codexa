import ChatMessage from "../models/ChatMessage.js";
import StudentSession from "../models/StudentSession.js";
import { asyncHandler, ValidationError } from "../utils/errors.js";

/**
 * GET /api/classroom/:code/messages
 * Last 100 chat messages so a late joiner has context.
 */
export const getMessages = asyncHandler(async (req, res) => {
  const room = req.room;
  if (room.type !== "CLASSROOM") throw ValidationError("Not a classroom room");

  const messages = await ChatMessage.find({ roomId: room._id })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();

  res.json({ messages: messages.reverse() });
});

/**
 * GET /api/classroom/:code/members
 * Current member list with presence status for the sidebar.
 */
export const getMembers = asyncHandler(async (req, res) => {
  const room = req.room;
  if (room.type !== "CLASSROOM") throw ValidationError("Not a classroom room");

  const members = await StudentSession.find({ roomId: room._id })
    .sort({ joinedAt: 1 })
    .lean();

  res.json({
    members: members.map((m) => ({
      sessionId: m.sessionId,
      name: m.name,
      status: m.status,
    })),
  });
});
