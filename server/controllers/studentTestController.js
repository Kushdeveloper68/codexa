import Submission from "../models/Submission.js";
import Question from "../models/Question.js";
import StudentSession from "../models/StudentSession.js";
import ActivityEvent from "../models/ActivityEvent.js";
import { asyncHandler, ValidationError } from "../utils/errors.js";
import { executeCode } from "../services/codeExecutionService.js";

const SEVERITY_BY_EVENT = {
  FULLSCREEN_EXITED: "MEDIUM",
  PASTE_ATTEMPT: "LOW",
  MULTIPLE_TAB_DETECTED: "MEDIUM",
  PAGE_HIDDEN: "LOW",
  COPY_ATTEMPT: "LOW",
  CUT_ATTEMPT: "LOW",
  PRINT_ATTEMPT: "LOW",
  NAVIGATION_ATTEMPT: "LOW",
};

// Events that count toward the warning threshold shown to the teacher.
const WARNING_EVENTS = new Set([
  "FULLSCREEN_EXITED",
  "PASTE_ATTEMPT",
  "MULTIPLE_TAB_DETECTED",
  "PAGE_HIDDEN",
]);

/**
 * PUT /api/test/:code/save
 * Debounced autosave endpoint. Upserts the submission doc per (student,
 * question) so re-saves overwrite in place rather than growing forever.
 */
export const saveCode = asyncHandler(async (req, res) => {
  const room = req.room;
  const student = req.studentSession;
  const { questionId, code } = req.body;

  const question = await Question.findOne({ _id: questionId, roomId: room._id });
  if (!question) throw ValidationError("Question not found in this room");

  await Submission.findOneAndUpdate(
    { roomId: room._id, studentSessionId: student.sessionId, questionId },
    { $set: { code, lastSavedAt: new Date() } },
    { upsert: true, new: true }
  );

  if (student.status === "NOT_STARTED") {
    student.status = "WRITING";
    student.startedAt = student.startedAt || new Date();
    await student.save();

    const io = req.app.get("io");
    io?.to(`room:${room.code}`).emit("student:started", {
      sessionId: student.sessionId,
      status: student.status,
      startedAt: student.startedAt,
    });
  }

  const io = req.app.get("io");
  io?.to(`room:${room.code}`).emit("code:saved", {
    sessionId: student.sessionId,
    questionId,
    lastSavedAt: new Date(),
  });

  res.json({ saved: true, lastSavedAt: new Date() });
});

/**
 * POST /api/test/:code/submit
 * Marks the student's session as SUBMITTED. Does not allow re-submission
 * unless the room explicitly allows it (settings.allowMultipleSubmissions).
 */
export const submitTest = asyncHandler(async (req, res) => {
  const room = req.room;
  const student = req.studentSession;

  if (student.status === "SUBMITTED" && !room.settings.allowMultipleSubmissions) {
    throw ValidationError("You have already submitted this test");
  }

  student.status = "SUBMITTED";
  student.submittedAt = new Date();
  await student.save();

  await ActivityEvent.create({
    roomId: room._id,
    studentSessionId: student.sessionId,
    eventType: "SUBMITTED",
    severity: "INFO",
    timestamp: new Date(),
  });

  const io = req.app.get("io");
  io?.to(`room:${room.code}`).emit("student:submitted", {
    sessionId: student.sessionId,
    status: student.status,
    submittedAt: student.submittedAt,
  });

  res.json({ submitted: true, submittedAt: student.submittedAt });
});

/**
 * POST /api/test/:code/activity
 * Records a browser-side monitoring signal. Server decides severity and
 * whether it counts toward the warning threshold — client cannot inflate
 * or suppress its own warning count.
 */
export const recordActivity = asyncHandler(async (req, res) => {
  const room = req.room;
  const student = req.studentSession;
  const { eventType, metadata } = req.body;

  const severity = SEVERITY_BY_EVENT[eventType] || "INFO";

  await ActivityEvent.create({
    roomId: room._id,
    studentSessionId: student.sessionId,
    eventType,
    severity,
    metadata,
    timestamp: new Date(),
  });

  let warningCount = student.warningCount;
  let warningsByType = student.warningsByType;
  if (WARNING_EVENTS.has(eventType)) {
    student.warningCount += 1;
    warningsByType = { ...(student.warningsByType || {}) };
    warningsByType[eventType] = (warningsByType[eventType] || 0) + 1;
    student.warningsByType = warningsByType;
    student.markModified("warningsByType");
    warningCount = student.warningCount;
    await student.save();
  }

  const io = req.app.get("io");
  io?.to(`room:${room.code}`).emit("activity:event", {
    sessionId: student.sessionId,
    name: student.name,
    eventType,
    severity,
    warningCount,
    warningsByType,
    timestamp: new Date(),
  });

  res.json({ recorded: true, warningCount, warningsByType });
});

/**
 * POST /api/test/:code/run
 * Executes the student's current code via the external sandboxed Piston
 * service (see codeExecutionService) and relays the result — this server
 * never runs the code itself. Also broadcasts the run to the teacher
 * dashboard in real time and persists the latest result on the
 * submission doc so it's visible in the student detail panel later.
 */
export const runCode = asyncHandler(async (req, res) => {
  const room = req.room;
  const student = req.studentSession;
  const { questionId, code, stdin } = req.body;

  const question = await Question.findOne({ _id: questionId, roomId: room._id });
  if (!question) throw ValidationError("Question not found in this room");

  const result = await executeCode({ language: room.language, sourceCode: code, stdin });

  await Submission.findOneAndUpdate(
    { roomId: room._id, studentSessionId: student.sessionId, questionId },
    {
      $set: {
        lastRun: {
          stdout: result.stdout,
          stderr: result.stderr,
          compileOutput: result.compileOutput,
          status: result.status,
          time: result.time,
          ranAt: new Date(),
        },
      },
    },
    { upsert: true }
  );

  const io = req.app.get("io");
  io?.to(`room:${room.code}`).emit("code:run", {
    sessionId: student.sessionId,
    name: student.name,
    questionId,
    questionOrder: question.order,
    stdout: result.stdout,
    stderr: result.stderr,
    compileOutput: result.compileOutput,
    status: result.status,
    time: result.time,
    timestamp: new Date(),
  });

  res.json({ result });
});

/**
 * GET /api/test/:code/my-submissions
 * Lets a reconnecting student re-fetch their own saved code (resilience:
 * "work should not disappear because the network temporarily disconnects").
 */
export const getMySubmissions = asyncHandler(async (req, res) => {
  const room = req.room;
  const student = req.studentSession;
  const submissions = await Submission.find({
    roomId: room._id,
    studentSessionId: student.sessionId,
  }).lean();

  res.json({
    submissions: submissions.map((s) => ({
      questionId: s.questionId,
      code: s.code,
      lastSavedAt: s.lastSavedAt,
    })),
    status: student.status,
  });
});
