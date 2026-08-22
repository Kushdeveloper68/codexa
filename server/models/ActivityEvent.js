import mongoose from "mongoose";

const { Schema } = mongoose;

export const ACTIVITY_EVENT_TYPES = [
  "STUDENT_JOINED",
  "TEST_STARTED",
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
  "DISCONNECTED",
  "RECONNECTED",
  "SUBMITTED",
];

const ActivityEventSchema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    studentSessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ACTIVITY_EVENT_TYPES,
      required: true,
    },
    // Neutral, non-accusatory severity used for UI styling only.
    severity: {
      type: String,
      enum: ["INFO", "LOW", "MEDIUM"],
      default: "INFO",
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export default mongoose.model("ActivityEvent", ActivityEventSchema);
