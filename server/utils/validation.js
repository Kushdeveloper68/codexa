import { z } from "zod";
import { ValidationError } from "./errors.js";

const nameField = z.string().trim().min(1, "Required").max(100);
const titleField = z.string().trim().min(1, "Required").max(200);

export const createTestRoomSchema = z.object({
  teacherName: nameField,
  title: titleField,
  language: z.enum(["C", "C++", "Java", "Python", "JavaScript"]),
  durationMinutes: z.number().int().min(1).max(600),
  questions: z
    .array(
      z.object({
        title: z.string().trim().max(200).optional().default(""),
        description: z.string().trim().min(1, "Question text required").max(5000),
      })
    )
    .min(1, "At least one question is required")
    .max(50, "Too many questions"),
  settings: z
    .object({
      fullscreenRequired: z.boolean().optional(),
      activityMonitoring: z.boolean().optional(),
      autosave: z.boolean().optional(),
      randomizeQuestions: z.boolean().optional(),
      allowMultipleSubmissions: z.boolean().optional(),
      warningThreshold: z.number().int().min(1).max(10).optional(),
    })
    .optional()
    .default({}),
});

export const createClassroomSchema = z.object({
  teacherName: nameField,
  title: titleField,
  language: z.enum(["C", "C++", "Java", "Python", "JavaScript"]).optional().default("JavaScript"),
});

export const joinRoomSchema = z.object({
  name: nameField,
  rollNumber: z.string().trim().max(50).optional().default(""),
});

export const submitCodeSchema = z.object({
  questionId: z.string().min(1),
  code: z.string().max(200000),
});

export const runCodeSchema = z.object({
  questionId: z.string().min(1),
  code: z.string().max(200000),
  stdin: z.string().max(20000).optional().default(""),
});

export const activityEventSchema = z.object({
  eventType: z.enum([
    "PAGE_HIDDEN",
    "PAGE_VISIBLE",
    "FULLSCREEN_EXITED",
    "FULLSCREEN_ENTERED",
    "COPY_ATTEMPT",
    "CUT_ATTEMPT",
    "PASTE_ATTEMPT",
    "PRINT_ATTEMPT",
    "NAVIGATION_ATTEMPT",
    "MULTIPLE_TAB_DETECTED",
  ]),
  metadata: z.record(z.any()).optional().default({}),
});

/**
 * Express middleware factory: validates req.body against a zod schema,
 * replaces req.body with the parsed (typed, defaulted) value, or throws
 * a clean 422 ValidationError instead of a raw zod stack trace.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return next(ValidationError(message));
    }
    req.body = result.data;
    next();
  };
}
