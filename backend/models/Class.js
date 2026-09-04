import { Schema, model } from "mongoose";

const classSchema = new Schema(
  {
    grade: { type: Number, required: true },
    section: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F'], required: true },
    campus: {
      type: Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    // students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    classTeacher: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Campus Admin
    },
  },
  { timestamps: true }
);

// Enforce that a teacher can be classTeacher for at most one class.
// sparse:true allows documents without classTeacher (null) and ensures uniqueness only for set values.
classSchema.index({ classTeacher: 1 }, { unique: true, sparse: true });

export default model("Class", classSchema);
