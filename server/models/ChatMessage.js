import mongoose from "mongoose";

const { Schema } = mongoose;

const ChatMessageSchema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    senderSessionId: { type: String, required: true },
    senderName: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.model("ChatMessage", ChatMessageSchema);
