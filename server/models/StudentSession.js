import mongoose from "mongoose";

const { Schema } = mongoose;

const StudentSessionSchema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // Optional: only meaningful for TEST rooms, but harmless for CLASSROOM
    rollNumber: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },
    status: {
      type: String,
      enum: ["NOT_STARTED", "WRITING", "SUBMITTED", "DISCONNECTED"],
      default: "NOT_STARTED",
    },
    warningCount: { type: Number, default: 0 },
    // Per-event-type breakdown, e.g. { FULLSCREEN_EXITED: 2, PASTE_ATTEMPT: 1 }
    // so the teacher dashboard can show *what kind* of activity was flagged,
    // not just a single opaque number.
    warningsByType: { type: Schema.Types.Mixed, default: {} },
    joinedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    lastHeartbeatAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A given name shouldn't collide oddly, but we do not enforce uniqueness on
// name — duplicate names are allowed (see spec: "Two users with same name").
StudentSessionSchema.index({ roomId: 1, sessionId: 1 });

export default mongoose.model("StudentSession", StudentSessionSchema);
