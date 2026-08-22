import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * A teacher session is issued once, at room-creation time.
 * The raw token is only ever sent to the client in the creation response /
 * set as an httpOnly cookie. Only its hash is stored here, so a DB leak
 * doesn't hand out live teacher tokens.
 */
const TeacherSessionSchema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TeacherSession", TeacherSessionSchema);
