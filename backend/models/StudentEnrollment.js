import { model, Schema } from "mongoose";

const studentEnrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    campus: { type: Schema.Types.ObjectId, ref: "Campus", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    rollNumber: { type: String, required: true },
    academicSession: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index -> For uniqueness
studentEnrollmentSchema.index(
  { student: 1, campus: 1, class: 1, rollNumber: 1 },
  { unique: true }
);

export default model("StudentEnrollment", studentEnrollmentSchema);
