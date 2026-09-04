import { Schema, model } from "mongoose";

const studentAttendanceSchema = new Schema(
  {
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: "StudentEnrollment",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      required: true,
    },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    campus: { type: Schema.Types.ObjectId, ref: "Campus", required: true },
    term: {
      type: String,
      enum: ["FirstTerm", "SecondTerm"],
      required: true,
    },
    academicSession: { type: String, required: true },
    date: { type: Date, default: Date.now },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default model("StudentAttendance", studentAttendanceSchema);
