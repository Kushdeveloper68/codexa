import ChatMessage from "../models/ChatMessage.js";
import StudentSession from "../models/StudentSession.js";
import Room from "../models/Room.js";

/**
 * Classroom-specific real-time events: live code sync + chat.
 * Both require the socket to have already joined a room via room:join.
 */
export function registerClassroomHandlers(io, socket) {
  // code:update — broadcast code changes to everyone else in the room.
  // The client is expected to debounce/throttle before emitting; we don't
  // persist every keystroke, only relay it. A lightweight "latest code"
  // snapshot could be cached here later for late joiners if needed.
  socket.on("code:update", (payload) => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const { code, cursor } = payload || {};
    if (typeof code !== "string" || code.length > 200000) return;

    socket.to(`room:${roomCode}`).emit("code:update", {
      code,
      cursor,
      from: socket.data.studentSessionId,
    });
  });

  // language:update — a member switches the shared editor's language.
  // Persisted on the Room so a late joiner sees the current language, and
  // broadcast live so everyone's editor + snippet reset together.
  socket.on("language:update", async (payload) => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const language = payload?.language;
    if (!["C", "C++", "Java", "Python", "JavaScript"].includes(language)) return;

    try {
      await Room.updateOne({ code: roomCode }, { $set: { language } });
    } catch (err) {
      console.error("language:update persist error", err);
    }

    io.to(`room:${roomCode}`).emit("language:update", {
      language,
      from: socket.data.studentSessionId,
    });
  });

  socket.on("chat:message", async (payload, ack) => {
    try {
      const { roomCode, studentSessionId } = socket.data;
      if (!roomCode || !studentSessionId) return ack?.({ error: "Not joined to a room" });

      const message = String(payload?.message || "").trim().slice(0, 1000);
      if (!message) return ack?.({ error: "Empty message" });

      const student = await StudentSession.findOne({ sessionId: studentSessionId });
      if (!student) return ack?.({ error: "Invalid session" });

      const room = await Room.findOne({ code: roomCode });
      if (!room) return ack?.({ error: "Room not found" });

      const doc = await ChatMessage.create({
        roomId: room._id,
        senderSessionId: studentSessionId,
        senderName: student.name,
        message,
        timestamp: new Date(),
      });

      io.to(`room:${roomCode}`).emit("chat:message", {
        senderName: doc.senderName,
        message: doc.message,
        timestamp: doc.timestamp,
      });

      ack?.({ ok: true });
    } catch (err) {
      console.error("chat:message error", err);
      ack?.({ error: "Failed to send message" });
    }
  });
}
