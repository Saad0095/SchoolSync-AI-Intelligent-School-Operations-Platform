import { model, Schema } from "mongoose";


//Will create / assign one campus + class + subject combination
const assignmentSchema = new Schema(
  {
    campus: { type: Schema.Types.ObjectId, ref: "Campus", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

assignmentSchema.index(
  { campus: 1, class: 1, subject: 1 },
  { unique: true }
)

export default model("Assignment", assignmentSchema);
