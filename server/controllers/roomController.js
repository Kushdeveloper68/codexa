import Room from "../models/Room.js";
import Question from "../models/Question.js";
import TeacherSession from "../models/TeacherSession.js";
import StudentSession from "../models/StudentSession.js";
import { generateRoomCode } from "../utils/roomCode.js";
import { generateToken, hashToken } from "../utils/tokens.js";
import { asyncHandler } from "../utils/errors.js";
import { ValidationError } from "../utils/errors.js";

const ROOM_EXPIRY_HOURS = Number(process.env.ROOM_EXPIRY_HOURS) || 12;

function expiresAt() {
  return new Date(Date.now() + ROOM_EXPIRY_HOURS * 60 * 60 * 1000);
}

// Generates a unique room code, retrying on the rare collision.
async function uniqueRoomCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const exists = await Room.exists({ code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique room code, please retry");
}

function teacherCookieOptions() {
  // In production the frontend (Vercel) and backend (Render) live on
  // different domains, so the cookie is cross-site from the browser's
  // point of view. "lax" cookies are NOT sent on cross-site fetch/XHR
  // requests — only "none" (which browsers require to be paired with
  // "secure") works here. Locally, frontend and backend are on
  // different ports of the same host, which browsers treat as
  // same-site, so "lax" is fine (and doesn't require HTTPS on localhost).
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: ROOM_EXPIRY_HOURS * 60 * 60 * 1000,
    path: "/",
  };
}

/**
 * POST /api/test-rooms
 * Creates a TEST room + its questions + a fresh teacher session in one go.
 * No login: the teacher's only credential is the httpOnly cookie set here.
 */
export const createTestRoom = asyncHandler(async (req, res) => {
  const { teacherName, title, language, durationMinutes, questions, settings } = req.body;

  const code = await uniqueRoomCode();
  const creatorSessionId = generateToken(16);

  const room = await Room.create({
    code,
    type: "TEST",
    title,
    creatorSessionId,
    status: "WAITING",
    language,
    durationMinutes,
    settings,
    expiresAt: expiresAt(),
  });

  await Question.insertMany(
    questions.map((q, i) => ({
      roomId: room._id,
      order: i,
      title: q.title,
      description: q.description,
    }))
  );

  const rawToken = generateToken();
  await TeacherSession.create({
    roomId: room._id,
    tokenHash: hashToken(rawToken),
    name: teacherName,
  });

  res.cookie(`teacher_${code}`, rawToken, teacherCookieOptions());

  res.status(201).json({
    room: {
      code: room.code,
      type: room.type,
      title: room.title,
      status: room.status,
      language: room.language,
      durationMinutes: room.durationMinutes,
      questionCount: questions.length,
      expiresAt: room.expiresAt,
    },
    // Also returned in the body (not just the cookie) so the client can
    // store it and send it back as an X-Teacher-Token header — necessary
    // because cross-site cookies (frontend and backend on different
    // domains) are unreliable across browsers, especially in private/
    // incognito modes. See requireTeacher.js for why.
    teacherToken: rawToken,
  });
});

/**
 * POST /api/classrooms
 * Creates a CLASSROOM room + teacher/host session.
 */
export const createClassroom = asyncHandler(async (req, res) => {
  const { teacherName, title, language } = req.body;

  const code = await uniqueRoomCode();
  const creatorSessionId = generateToken(16);

  const room = await Room.create({
    code,
    type: "CLASSROOM",
    title,
    creatorSessionId,
    status: "ACTIVE",
    language: language || "JavaScript",
    expiresAt: expiresAt(),
  });

  const rawToken = generateToken();
  await TeacherSession.create({
    roomId: room._id,
    tokenHash: hashToken(rawToken),
    name: teacherName,
  });

  res.cookie(`teacher_${code}`, rawToken, teacherCookieOptions());

  // The classroom creator also participates in the shared editor/chat, so
  // give them a student session too — otherwise they'd be redirected to a
  // separate "join" step for a room they just made.
  const studentSessionId = generateToken();
  const creatorStudentSession = await StudentSession.create({
    roomId: room._id,
    sessionId: studentSessionId,
    name: teacherName,
    status: "WRITING",
  });
  res.cookie(`student_${code}`, studentSessionId, studentCookieOptions(room));

  res.status(201).json({
    room: {
      code: room.code,
      type: room.type,
      title: room.title,
      status: room.status,
      language: room.language,
      expiresAt: room.expiresAt,
    },
    student: {
      sessionId: creatorStudentSession.sessionId,
      name: creatorStudentSession.name,
    },
    // See createTestRoom for why this is also returned in the body.
    teacherToken: rawToken,
  });
});

/**
 * GET /api/rooms/:code
 * Public room lookup — used by the Join flow to show room info / validate
 * the code before asking for name+roll.
 */
export const getRoom = asyncHandler(async (req, res) => {
  const room = req.room;
  res.json({
    room: {
      code: room.code,
      type: room.type,
      title: room.title,
      status: room.status,
      language: room.language,
      durationMinutes: room.durationMinutes,
      testStartedAt: room.testStartedAt,
      testEndsAt: room.testEndsAt,
      settings: room.settings,
      expiresAt: room.expiresAt,
    },
  });
});

function studentCookieOptions(room) {
  const ttlMs = Math.max(room.expiresAt.getTime() - Date.now(), 60 * 1000);
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: ttlMs,
    path: "/",
  };
}

/**
 * POST /api/rooms/:code/join
 * Student joins with name + optional rollNumber. No password, no account.
 * We deliberately do NOT use IP as identity (see spec: NAT in college labs).
 */
export const joinRoom = asyncHandler(async (req, res) => {
  const room = req.room;
  if (!room.isJoinable()) {
    throw ValidationError("This room is not currently accepting participants");
  }

  const { name, rollNumber } = req.body;
  const sessionId = generateToken();

  const studentSession = await StudentSession.create({
    roomId: room._id,
    sessionId,
    name,
    rollNumber: rollNumber || null,
    status: "NOT_STARTED",
  });

  res.cookie(`student_${room.code}`, sessionId, studentCookieOptions(room));

  // Real-time notify: emitted from the route via req.app's io instance so
  // controllers stay decoupled from socket wiring specifics.
  const io = req.app.get("io");
  if (io) {
    io.to(`room:${room.code}`).emit("student:joined", {
      sessionId: studentSession.sessionId,
      name: studentSession.name,
      rollNumber: studentSession.rollNumber,
      status: studentSession.status,
      joinedAt: studentSession.joinedAt,
    });
  }

  res.status(201).json({
    room: { code: room.code, type: room.type, title: room.title, status: room.status },
    student: {
      sessionId: studentSession.sessionId,
      name: studentSession.name,
      rollNumber: studentSession.rollNumber,
    },
  });
});
