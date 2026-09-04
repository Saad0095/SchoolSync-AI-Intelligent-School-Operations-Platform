import { model, Schema } from "mongoose";


const teacherAssignmentSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default model("TeacherAssignment", teacherAssignmentSchema)
