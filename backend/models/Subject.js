import { model, Schema } from "mongoose";

const subjectSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Super Admin
    },
  },
  { timestamps: true }
);

export default model("Subject", subjectSchema);
