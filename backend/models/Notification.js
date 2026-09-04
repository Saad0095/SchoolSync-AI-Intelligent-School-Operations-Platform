import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["attendance", "exam", "marks", "announcement", "system"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String }, // Optional URL to navigate to
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });

export default model("Notification", notificationSchema);
