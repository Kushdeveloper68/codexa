import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Room is the generic entity everything revolves around.
 * type distinguishes CLASSROOM vs TEST (future: ASSIGNMENT, QUIZ, etc.)
 * settings is a loose bag so each room type can store type-specific config
 * without needing schema migrations later.
 */
const RoomSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["CLASSROOM", "TEST"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    creatorSessionId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["WAITING", "ACTIVE", "ENDED", "EXPIRED"],
      default: "WAITING",
      index: true,
    },
    // Test-specific fields (ignored for CLASSROOM rooms)
    language: { type: String, default: null },
    durationMinutes: { type: Number, default: null },
    testStartedAt: { type: Date, default: null },
    testEndsAt: { type: Date, default: null },

    settings: {
      fullscreenRequired: { type: Boolean, default: false },
      activityMonitoring: { type: Boolean, default: true },
      autosave: { type: Boolean, default: true },
      randomizeQuestions: { type: Boolean, default: false },
      allowMultipleSubmissions: { type: Boolean, default: false },
      warningThreshold: { type: Number, default: 3 },
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index - auto cleanup
    },
  },
  { timestamps: true }
);

RoomSchema.methods.isJoinable = function () {
  if (this.status === "ENDED" || this.status === "EXPIRED") return false;
  if (this.expiresAt < new Date()) return false;
  return true;
};

export default mongoose.model("Room", RoomSchema);
