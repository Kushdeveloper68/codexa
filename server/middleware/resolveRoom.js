import Room from "../models/Room.js";
import { NotFoundError, GoneError } from "../utils/errors.js";
import { asyncHandler } from "../utils/errors.js";

/**
 * Loads the room by :code, expires it server-side if past expiresAt
 * (never trust a client-side timer), and attaches it as req.room.
 */
export const resolveRoom = asyncHandler(async (req, res, next) => {
  const code = String(req.params.code || "").toUpperCase();
  const room = await Room.findOne({ code });

  if (!room) throw NotFoundError("Room not found");

  if (room.expiresAt < new Date() && room.status !== "EXPIRED") {
    room.status = "EXPIRED";
    await room.save();
  }

  if (room.status === "EXPIRED") throw GoneError("This room has expired");
  if (room.status === "ENDED") throw GoneError("This room has ended");

  req.room = room;
  next();
});
