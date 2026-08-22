import { Router } from "express";
import { createTestRoom, createClassroom, getRoom, joinRoom } from "../controllers/roomController.js";
import { resolveRoom } from "../middleware/resolveRoom.js";
import { validateBody, createTestRoomSchema, createClassroomSchema, joinRoomSchema } from "../utils/validation.js";
import { createRoomLimiter, joinRoomLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/test-rooms", createRoomLimiter, validateBody(createTestRoomSchema), createTestRoom);
router.post("/classrooms", createRoomLimiter, validateBody(createClassroomSchema), createClassroom);

router.get("/rooms/:code", resolveRoom, getRoom);
router.post("/rooms/:code/join", joinRoomLimiter, resolveRoom, validateBody(joinRoomSchema), joinRoom);

export default router;
