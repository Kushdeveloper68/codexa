import { Router } from "express";
import { resolveRoom } from "../middleware/resolveRoom.js";
import { requireTeacher } from "../middleware/requireTeacher.js";
import { requireStudent } from "../middleware/requireStudent.js";
import { validateBody, submitCodeSchema, activityEventSchema } from "../utils/validation.js";
import {
  startTest,
  endTest,
  getDashboard,
  getStudentDetail,
  getQuestions,
  getResults,
} from "../controllers/testController.js";
import {
  saveCode,
  submitTest,
  recordActivity,
  getMySubmissions,
} from "../controllers/studentTestController.js";

const router = Router();

// Teacher-only controls — requireTeacher checks the httpOnly cookie against
// this specific room, so a student with just the room code is rejected.
router.post("/:code/start", resolveRoom, requireTeacher, startTest);
router.post("/:code/end", resolveRoom, requireTeacher, endTest);
router.get("/:code/dashboard", resolveRoom, requireTeacher, getDashboard);
router.get("/:code/students/:sessionId", resolveRoom, requireTeacher, getStudentDetail);
router.get("/:code/results", resolveRoom, requireTeacher, getResults);

// Student-only actions — requireStudent checks the student's own session
// cookie for this room.
router.get("/:code/questions", resolveRoom, requireStudent, getQuestions);
router.put("/:code/save", resolveRoom, requireStudent, validateBody(submitCodeSchema), saveCode);
router.post("/:code/submit", resolveRoom, requireStudent, submitTest);
router.post("/:code/activity", resolveRoom, requireStudent, validateBody(activityEventSchema), recordActivity);
router.get("/:code/my-submissions", resolveRoom, requireStudent, getMySubmissions);

export default router;
