import Room from "../models/Room.js";
import Question from "../models/Question.js";
import StudentSession from "../models/StudentSession.js";
import ActivityEvent from "../models/ActivityEvent.js";
import Submission from "../models/Submission.js";
import { asyncHandler, ValidationError } from "../utils/errors.js";

/**
 * POST /api/test/:code/start  (teacher only)
 * Server is authoritative for timing: we store testStartedAt/testEndsAt
 * here so no client can fabricate more time by editing local state.
 */
export const startTest = asyncHandler(async (req, res) => {
  const room = req.room;
  if (room.type !== "TEST") throw ValidationError("Not a test room");
  if (room.status !== "WAITING") throw ValidationError("Test already started or ended");

  const now = new Date();
  room.status = "ACTIVE";
  room.testStartedAt = now;
  room.testEndsAt = new Date(now.getTime() + room.durationMinutes * 60 * 1000);
  await room.save();

  const io = req.app.get("io");
  io?.to(`room:${room.code}`).emit("test:start", {
    testStartedAt: room.testStartedAt,
    testEndsAt: room.testEndsAt,
  });

  res.json({
    status: room.status,
    testStartedAt: room.testStartedAt,
    testEndsAt: room.testEndsAt,
  });
});

/**
 * POST /api/test/:code/end  (teacher only)
 * Ends the test early. Any un-submitted autosaved work is left as-is —
 * we do not silently fabricate a "submission" the student never confirmed.
 */
export const endTest = asyncHandler(async (req, res) => {
  const room = req.room;
  if (room.type !== "TEST") throw ValidationError("Not a test room");
  if (room.status !== "ACTIVE") throw ValidationError("Test is not currently active");

  room.status = "ENDED";
  await room.save();

  const io = req.app.get("io");
  io?.to(`room:${room.code}`).emit("test:end", { status: room.status });

  res.json({ status: room.status });
});

/**
 * GET /api/test/:code/dashboard (teacher only)
 * Real aggregate numbers for the summary cards + full student table —
 * never hardcoded, computed fresh from StudentSession/ActivityEvent.
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const room = req.room;
  if (room.type !== "TEST") throw ValidationError("Not a test room");

  const students = await StudentSession.find({ roomId: room._id }).sort({ joinedAt: 1 }).lean();

  const summary = {
    totalStudents: students.length,
    started: students.filter((s) => s.startedAt).length,
    writing: students.filter((s) => s.status === "WRITING").length,
    submitted: students.filter((s) => s.status === "SUBMITTED").length,
    warnings: students.reduce((sum, s) => sum + (s.warningCount || 0), 0),
  };

  res.json({
    room: {
      code: room.code,
      title: room.title,
      status: room.status,
      testStartedAt: room.testStartedAt,
      testEndsAt: room.testEndsAt,
    },
    summary,
    students: students.map((s) => ({
      sessionId: s.sessionId,
      name: s.name,
      rollNumber: s.rollNumber,
      status: s.status,
      warningCount: s.warningCount,
      warningsByType: s.warningsByType || {},
      joinedAt: s.joinedAt,
      startedAt: s.startedAt,
      submittedAt: s.submittedAt,
    })),
  });
});

/**
 * GET /api/test/:code/students/:sessionId (teacher only)
 * Detail panel data: full activity history for one student.
 */
export const getStudentDetail = asyncHandler(async (req, res) => {
  const room = req.room;
  const student = await StudentSession.findOne({
    roomId: room._id,
    sessionId: req.params.sessionId,
  }).lean();

  if (!student) throw ValidationError("Student not found in this room");

  const activity = await ActivityEvent.find({
    roomId: room._id,
    studentSessionId: student.sessionId,
  })
    .sort({ timestamp: 1 })
    .lean();

  res.json({
    student,
    activity: activity.map((a) => ({
      eventType: a.eventType,
      timestamp: a.timestamp,
      severity: a.severity,
    })),
  });
});

/**
 * GET /api/test/:code/questions
 * Available to a joined student (their code editor needs the question
 * list). Requires requireStudent upstream.
 */
export const getQuestions = asyncHandler(async (req, res) => {
  const room = req.room;
  const questions = await Question.find({ roomId: room._id }).sort({ order: 1 }).lean();
  res.json({
    questions: questions.map((q) => ({
      id: q._id,
      order: q.order,
      title: q.title,
      description: q.description,
    })),
  });
});

/**
 * GET /api/test/:code/results (teacher only)
 * Submission status per student. No fake scores — automatic evaluation
 * isn't implemented in this MVP, so we surface submission state + code only.
 */
export const getResults = asyncHandler(async (req, res) => {
  const room = req.room;
  const students = await StudentSession.find({ roomId: room._id }).lean();
  const submissions = await Submission.find({ roomId: room._id }).lean();

  const byStudent = students.map((s) => ({
    sessionId: s.sessionId,
    name: s.name,
    rollNumber: s.rollNumber,
    submitted: s.status === "SUBMITTED",
    submittedAt: s.submittedAt,
    submissions: submissions
      .filter((sub) => sub.studentSessionId === s.sessionId)
      .map((sub) => ({
        questionId: sub.questionId,
        code: sub.code,
        submittedAt: sub.submittedAt,
        lastSavedAt: sub.lastSavedAt,
      })),
  }));

  res.json({
    room: { code: room.code, title: room.title, status: room.status },
    totalStudents: students.length,
    submittedCount: students.filter((s) => s.status === "SUBMITTED").length,
    students: byStudent,
  });
});
