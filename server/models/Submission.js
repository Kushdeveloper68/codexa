import mongoose from "mongoose";

const { Schema } = mongoose;

const SubmissionSchema = new Schema(
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
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    code: {
      type: String,
      default: "",
      maxlength: 200000, // ~200kb ceiling, generous for a lab answer
    },
    // Autosave writes update this doc in place; submittedAt is only set on
    // final submit so autosave and submit are clearly distinguishable.
    lastSavedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },

    // Most recent "Run Code" result for this (student, question) pair.
    // Overwritten on every run — this is a live scratchpad, not a history.
    lastRun: {
      stdout: { type: String, default: "" },
      stderr: { type: String, default: "" },
      compileOutput: { type: String, default: "" },
      status: { type: String, default: null },
      time: { type: String, default: null },
      ranAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

SubmissionSchema.index(
  { roomId: 1, studentSessionId: 1, questionId: 1 },
  { unique: true }
);

export default mongoose.model("Submission", SubmissionSchema);
