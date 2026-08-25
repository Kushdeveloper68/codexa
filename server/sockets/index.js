import { parseCookie } from "cookie";
import Room from "../models/Room.js";
import StudentSession from "../models/StudentSession.js";
import TeacherSession from "../models/TeacherSession.js";
import { hashToken } from "../utils/tokens.js";
import { registerClassroomHandlers } from "./classroomHandlers.js";
import { registerTestHandlers } from "./testHandlers.js";

/**
 * Teacher identity for sockets is verified against the DB either way —
 * this just decides which raw token to check. Preferred: the client now
 * sends its stored teacherToken directly in the room:join payload (see
 * roomController — the token is returned in the create-room response
 * body specifically so the client can do this). Falling back to reading
 * the httpOnly teacher_<code> cookie from the handshake still works for
 * local dev, but cross-site cookies are unreliable in production
 * (browsers increasingly block them by default, e.g. Chrome Incognito),
 * so the payload path is what actually works once deployed.
 */
function getTeacherTokenFromHandshake(socket, roomCode) {
  const rawCookie = socket.handshake.headers?.cookie;
  if (!rawCookie) return null;
  const parsed = parseCookie(rawCookie);
  return parsed[`teacher_${roomCode}`] || null;
}

// Grace period before we mark a socket's student as DISCONNECTED, so a
// page refresh or brief network blip doesn't visibly kick them.
const DISCONNECT_GRACE_MS = 8000;
const pendingDisconnects = new Map(); // sessionId -> timeout handle

/**
 * Registers all Socket.IO event handlers. Every privileged action is
 * re-validated against the DB here — the server never trusts a
 * client-declared role or sessionId without checking it belongs to the
 * room being acted on.
 */
export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    // Identity is established explicitly via room:join, not at connection
    // time, since a single socket may only ever join one room in this app.
    socket.data.roomCode = null;
    socket.data.studentSessionId = null;
    socket.data.isTeacher = false;

    socket.on("room:join", async (payload, ack) => {
      try {
        const { roomCode, studentSessionId, asTeacher, teacherToken: payloadTeacherToken } = payload || {};
        if (!roomCode) return ack?.({ error: "roomCode required" });

        const room = await Room.findOne({ code: String(roomCode).toUpperCase() });
        if (!room) return ack?.({ error: "Room not found" });

        const teacherToken = asTeacher
          ? payloadTeacherToken || getTeacherTokenFromHandshake(socket, room.code)
          : null;

        if (!room.isJoinable() && !teacherToken) {
          return ack?.({ error: "Room is not currently active" });
        }

        let identity = null;

        if (asTeacher) {
          if (!teacherToken) return ack?.({ error: "No teacher session cookie found" });
          const session = await TeacherSession.findOne({
            roomId: room._id,
            tokenHash: hashToken(teacherToken),
          });
          if (!session) return ack?.({ error: "Invalid teacher session" });
          socket.data.isTeacher = true;
          identity = { role: "teacher", name: session.name };
        } else if (studentSessionId) {
          const student = await StudentSession.findOne({
            roomId: room._id,
            sessionId: studentSessionId,
          });
          if (!student) return ack?.({ error: "Invalid student session" });

          // Cancel any pending "mark disconnected" timer — this is a
          // reconnect, not a new join.
          const pending = pendingDisconnects.get(studentSessionId);
          if (pending) {
            clearTimeout(pending);
            pendingDisconnects.delete(studentSessionId);
            io.to(`room:${room.code}`).emit("student:reconnected", {
              sessionId: student.sessionId,
              name: student.name,
            });
          } else if (student.status === "DISCONNECTED") {
            student.status = "WRITING";
            await student.save();
          }

          socket.data.studentSessionId = studentSessionId;
          identity = { role: "student", name: student.name, status: student.status };
        } else {
          return ack?.({ error: "studentSessionId or teacherToken required" });
        }

        socket.data.roomCode = room.code;
        socket.data.roomType = room.type;
        socket.join(`room:${room.code}`);

        ack?.({ ok: true, identity, room: { code: room.code, type: room.type, status: room.status } });
      } catch (err) {
        console.error("room:join error", err);
        ack?.({ error: "Internal error joining room" });
      }
    });

    registerClassroomHandlers(io, socket);
    registerTestHandlers(io, socket);

    socket.on("disconnect", async () => {
      const { roomCode, studentSessionId } = socket.data;
      if (!roomCode || !studentSessionId) return;

      // Delay marking DISCONNECTED so a quick refresh/reconnect is invisible
      // to the teacher dashboard, per the "handle reconnects carefully" spec.
      const timeout = setTimeout(async () => {
        try {
          const student = await StudentSession.findOne({ sessionId: studentSessionId });
          if (!student || student.status === "SUBMITTED") return;
          student.status = "DISCONNECTED";
          await student.save();
          io.to(`room:${roomCode}`).emit("student:disconnected", {
            sessionId: studentSessionId,
          });
        } catch (err) {
          console.error("disconnect handling error", err);
        } finally {
          pendingDisconnects.delete(studentSessionId);
        }
      }, DISCONNECT_GRACE_MS);

      pendingDisconnects.set(studentSessionId, timeout);
    });
  });
}