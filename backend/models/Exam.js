import { Schema, model } from "mongoose";

//  This is exam creation in db (Evaluation Type)
const examSchema = new Schema(
  {
    // name: { type: String, required: true },
    term: {
      type: String,
      enum: ["FirstTerm", "SecondTerm"],
      required: true,
    },
    academicSession: { type: String, required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    campus: { type: Schema.Types.ObjectId, ref: "Campus", required: true },
    
    totalMarks: { type: Number, required: true },
    type: {
      type: String,
      enum: [
        "Examination",
        "Assessment",
        "Quiz",
        "Homework",
        "Classwork",
        "Practical",
        "Notebook",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

export default model("Exam", examSchema);
