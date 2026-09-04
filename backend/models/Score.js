import "dotenv/config";
import { Schema, model } from "mongoose";
import Exam from "./Exam.js";
import Class from "./Class.js";
import Marksheet from "./Marksheet.js";
import logger from "../utils/logger.js";
import { generateReportCardRemark } from "../services/groqService.js";

const scoreSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    campus: { type: Schema.Types.ObjectId, ref: "Campus", required: true },

    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    isPresent: { type: Boolean, default: true },
    marksObtained: { type: Number, min: 0, required: true },

    // You can calculate Percentage from marks
    remarks: { type: String }, // Optional
    enteredBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

scoreSchema.index({ student: 1, exam: 1 }, { unique: true });

function getGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

export async function generateMarksheet(scoreDoc) {
  if (!scoreDoc) return;
  const exam = await Exam.findById(scoreDoc.exam);
  if (!exam) return;

  const { term, academicSession } = exam;
  const classData = await Class.findById(scoreDoc.class).populate(
    "subjects",
    "_id name"
  );
  if (!classData || !classData.subjects) return;

  const subjectIds = classData.subjects.map((sub) => sub._id.toString());
  const allScores = await model("Score")
    .find({ student: scoreDoc.student, class: scoreDoc.class })
    .populate("exam", "term academicSession totalMarks")
    .populate("subject", "name")
    .populate("student", "name");

  const termScores = allScores.filter(
    (s) =>
      s.exam &&
      s.exam.term === term &&
      s.exam.academicSession === academicSession
  );

  const scoredSubject = termScores.map((s) => s.subject._id.toString());
  const allSubjectsScored = subjectIds.every((id) =>
    scoredSubject.includes(id)
  );
  if (!allSubjectsScored) {
    logger.info(
      "Waiting for all subjects to be scored, cannot generate marksheet"
    );
    return;
  }

  const subjectMap = new Map();
  for (const s of termScores) {
    const subId = s.subject._id.toString();
    if (!subjectMap.has(subId)) {
      subjectMap.set(subId, {
        subject: s.subject,
        marksObtained: 0,
        totalMarks: 0,
      });
    }
    const subData = subjectMap.get(subId);
    subData.marksObtained += s.marksObtained;
    subData.totalMarks += s.exam.totalMarks;
  }

  const subjects = Array.from(subjectMap.values()).map((s) => {
    const percentage = (s.marksObtained / s.totalMarks) * 100;
    return { ...s, percentage, grade: getGrade(percentage) };
  });

  const grandObtained = subjects.reduce(
    (acc, curr) => acc + curr.marksObtained,
    0
  );
  const grandTotal = subjects.reduce((acc, curr) => acc + curr.totalMarks, 0);
  const grandPercentage = (grandObtained / grandTotal) * 100;
  const overallGrade = getGrade(grandPercentage);

  let fallbackRemarks = "Needs Improvement";
  if (overallGrade === "A+" || overallGrade === "A") fallbackRemarks = "Excellent";
  else if (overallGrade === "B") fallbackRemarks = "Very Good";
  else if (overallGrade === "C") fallbackRemarks = "Good";
  else if (overallGrade === "D") fallbackRemarks = "Fair";

  const marksheet = await Marksheet.findOneAndUpdate(
    { student: scoreDoc.student, class: scoreDoc.class, term, academicSession },
    {
      student: scoreDoc.student,
      class: scoreDoc.class,
      campus: scoreDoc.campus,
      term,
      academicSession,
      subjects,
      grandObtained,
      grandTotal,
      overallPercentage: grandPercentage,
      overallGrade,
      $setOnInsert: { finalRemarks: fallbackRemarks, isAIGenerated: false },
    },
    { upsert: true, new: true }
  );

  const studentName = scoreDoc.student?.name || (termScores[0]?.student?.name ?? scoreDoc.student?.toString());
  
  // Asynchronous non-blocking AI remark generation
  if (allSubjectsScored && marksheet.isAIGenerated !== true) {
    const subjectsAndMarks = subjects.map(s => `• ${s.subject.name}: ${s.marksObtained}/${s.totalMarks} (${s.grade})`).join("\n");
    generateAndSaveRemark(marksheet._id, studentName, subjectsAndMarks, fallbackRemarks).catch(err => logger.error(err));
  }

  logger.info(`✅ Marksheet updated for: ${studentName}`);
}

async function generateAndSaveRemark(marksheetId, studentName, subjectsAndMarks, fallbackRemarks) {
  try {
    const aiRemark = await generateReportCardRemark(studentName, subjectsAndMarks);
    if (aiRemark) {
      await Marksheet.findByIdAndUpdate(marksheetId, {
        finalRemarks: aiRemark.trim(),
        isAIGenerated: true
      });
      logger.info(`✅ AI Remark saved for marksheet ${marksheetId}`);
    }
  } catch (error) {
    logger.error(`AI remark generation failed for ${marksheetId}: ${error.message}`);
    // Will naturally fallback to the default setOnInsert
  }
}

scoreSchema.post("save", async function (doc) {
  await generateMarksheet(doc);
});
scoreSchema.post("findOneAndUpdate", async function (doc) {
  await generateMarksheet(doc);
});

export default model("Score", scoreSchema);
