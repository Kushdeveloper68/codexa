import { Router } from "express";
import { resolveRoom } from "../middleware/resolveRoom.js";
import { getMessages, getMembers } from "../controllers/classroomController.js";

const router = Router();

router.get("/:code/messages", resolveRoom, getMessages);
router.get("/:code/members", resolveRoom, getMembers);

export default router;
