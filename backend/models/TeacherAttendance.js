import { Schema, model } from "mongoose";

const teacherAttendanceSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      required: true,
    },
    campus: { type: Schema.Types.ObjectId, ref: "Campus" },
    term: {
      type: String,
      enum: ["FirstTerm", "SecondTerm"],
    },
    academicSession: { type: String },
    checkIn: { type: Date }, //optional
    checkOut: { type: Date }, //optional
    date: { type: Date, default: Date.now },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default model("TeacherAttendance", teacherAttendanceSchema);
