import Score from "../models/Score.js";
import Campus from "../models/Campus.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Assignment from "../models/Assignment.js";
import Class from "../models/Class.js";
import express from "express";
import Exam from "../models/Exam.js";
import StudentEnrollment from "../models/StudentEnrollment.js";

export const addScore = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    let {
      classId,
      subjectId,
      campusId,
      examId,
      scores, // Array of {studentId, marksObtained}
    } = req.body;

    // Role validation
    if (
      role !== "campus-admin" &&
      role !== "teacher" &&
      role !== "super-admin"
    ) {
      return res.status(403).json({
        message: "Forbidden: You're not allowed to perform this action",
      });
    }

    // Campus validation for campus-admin
    if (role === "campus-admin") {
      const campusData = await Campus.findOne({ campusAdmin: userId });
      if (!campusData) {
        return res
          .status(403)
          .json({ message: "You don't have a campus assigned" });
      }
      campusId = campusData._id.toString();
    } else if (role === "super-admin" && !campusId) {
      return res.status(400).json({ message: "campusId is required for super admin." });
    }

    // Teacher validation
    if (role === "teacher") {
      const filterConditions = [];

      const mainClass = await Class.findOne({
        classTeacher: userId,
        isActive: true,
      });
      if (mainClass) {
        filterConditions.push({
          class: mainClass._id.toString(),
          campus: campusId,
          subject: subjectId,
        });
      }

      const teacherAssign = await TeacherAssignment.findOne({
        teacher: userId,
        isActive: true,
      }).populate({
        path: "assignments",
        match: { isActive: true },
        select: "campus class subject",
      });

      if (teacherAssign && teacherAssign.assignments.length > 0) {
        teacherAssign.assignments.forEach((a) => {
          filterConditions.push({
            campus: a.campus.toString(),
            class: a.class.toString(),
            subject: a.subject.toString(),
          });
        });
      }

      if (filterConditions.length === 0) {
        return res
          .status(403)
          .json({ message: "You don't have any active assignments or class" });
      }

      const allowed = filterConditions.some(
        (c) =>
          c.campus === campusId &&
          c.class === classId &&
          c.subject === subjectId
      );

      if (!allowed) {
        return res.status(403).json({
          message:
            "You can only add scores for your assigned or class-teacher classes/subjects",
        });
      }
    }

    // Validate required fields
    if (!classId || !subjectId || !campusId || !examId || !Array.isArray(scores)) {
      return res.status(400).json({
        message:
          "Missing required fields: classId, subjectId, campusId, examId, and scores array",
      });
    }

    // Filter out empty scores and validate
    const validScores = scores.filter(
      (s) => s.studentId && (s.marksObtained !== null && s.marksObtained !== undefined)
    );

    if (validScores.length === 0) {
      return res.status(400).json({
        message: "No valid scores provided. Each score must have studentId and marksObtained",
      });
    }

    // Check for existing scores before batch insert
    const studentIds = validScores.map((s) => s.studentId);
    const existingScores = await Score.find({
      student: { $in: studentIds },
      exam: examId,
      subject: subjectId,
      class: classId,
    });

    // Separate new and existing scores
    const newScores = validScores.filter(
      (s) => !existingScores.some((es) => es.student.toString() === s.studentId)
    );

    const scoresForUpdate = validScores.filter(
      (s) => existingScores.some((es) => es.student.toString() === s.studentId)
    );

    // Update existing scores
    let updatedCount = 0;
    for (const scoreData of scoresForUpdate) {
      await Score.findOneAndUpdate(
        {
          student: scoreData.studentId,
          exam: examId,
          subject: subjectId,
          class: classId,
        },
        { marksObtained: parseFloat(scoreData.marksObtained) || 0 },
        { new: true, runValidators: true }
      );
      updatedCount++;
    }

    // Insert new scores
    let insertedScores = [];
    if (newScores.length > 0) {
      const scoresToInsert = newScores.map((s) => ({
        student: s.studentId,
        class: classId,
        subject: subjectId,
        campus: campusId,
        exam: examId,
        marksObtained: parseFloat(s.marksObtained) || 0,
        enteredBy: userId,
      }));

      insertedScores = await Score.insertMany(scoresToInsert, {
        ordered: false,
      });
    }

    res.status(201).json({
      message: `Successfully saved scores. Updated: ${updatedCount}, Created: ${newScores.length}`,
      count: validScores.length,
      inserted: insertedScores.length,
      updated: updatedCount,
    });
  } catch (error) {
    console.error("Add Score Error:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getScoresByExam = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const { classId, subjectId, examType, page = 1, limit = 5, term, academicSession } = req.query;

    if (!classId) return res.status(400).json({ message: "classId is required" });

    let filter = {};

    // Role-based filtering
    if (!["campus-admin", "teacher", "super-admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden: You're not allowed to view the scores" });
    }

    if (role === "campus-admin") {
      const campusData = await Campus.findOne({ campusAdmin: userId });
      if (!campusData) return res.status(403).json({ message: "You don't have any campus assigned" });
      filter.campus = campusData._id;
    } else if (role === "teacher") {
      const filterOr = [];

      const mainClass = await Class.findOne({ classTeacher: userId, isActive: true });
      if (mainClass) filterOr.push({ class: mainClass._id });

      const teacherAssign = await TeacherAssignment.findOne({ teacher: userId, isActive: true })
        .populate({ path: "assignments", match: { isActive: true }, select: "campus class subject" });

      if (teacherAssign?.assignments?.length > 0) {
        teacherAssign.assignments.forEach(a => {
          filterOr.push({
            campus: a.campus.toString(),
            class: a.class.toString(),
            subject: a.subject.toString(),
          });
        });
      }

      if (filterOr.length === 0) {
        return res.status(403).json({ message: "You don't have any active class or assignments" });
      }

      filter.$or = filterOr;
    }

    // Exam filter
    let examFilter = {};
    if (academicSession) examFilter.academicSession = academicSession;
    if (term) examFilter.term = term;
    if (examType) examFilter.type = examType;
    examFilter.class = classId; // Add class filter

    const exams = await Exam.find(examFilter).select("_id type term totalMarks campus");
    if (exams.length > 0) filter.exam = { $in: exams.map(e => e._id) };

    // Get campusId from first exam - convert to string
    const campusId = exams.length > 0 ? exams[0].campus?.toString() : null;

    // Fetch all students in the class
    const allStudents = await StudentEnrollment.find({ class: classId, isActive: true })
      .populate("student", "name");

    // Fetch existing scores
    const existingScores = await Score.find({
      ...filter,
      student: { $in: allStudents.map(s => s.student._id) },
    })
      .populate("student", "name")
      .populate("class", "grade section")
      .populate("subject", "name")
      .populate("exam", "term type totalMarks")
      .populate("campus", "name location")
      .populate("enteredBy", "name role");

    // Merge students with existing scores, default marks = 0
    const mergedScores = allStudents.map(enrollment => {
      const existing = existingScores.find(
        s => s.student._id.toString() === enrollment.student._id.toString()
      );

      return {
        _id: existing?._id || null,
        student: enrollment.student,        // _id + name
        rollNumber: enrollment.rollNumber,  // rollNumber from enrollment
        class: existing?.class || null,
        subject: existing?.subject || null,
        exam: existing?.exam || null,
        campus: existing?.campus || null,
        enteredBy: existing?.enteredBy || null,
        marks: existing?.marksObtained || 0,
      };
    });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedScores = mergedScores.slice(skip, skip + parseInt(limit));

    res.json({
      totalScores: mergedScores.length,
      page: parseInt(page),
      limit: parseInt(limit),
      campusId: campusId || null,
      scores: paginatedScores,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};


// export const getScoresByExam = async (req, res) => {
//   try {
//     const { role, _id: userId, classId, subjectId,examType } = req.user;
//     const { page = 1, limit = 5, term, academicSession } = req.query;
//     let filter = {};
//     if (
//       role !== "campus-admin" &&
//       role !== "teacher" &&
//       role !== "super-admin"
//     ) {
//       return res
//         .status(403)
//         .json({ message: "Forbidden: You're not allowed to view the scores" });
//     }
//     if (role === "campus-admin") {
//       const campusData = await Campus.findOne({ campusAdmin: userId });
//       if (!campusData) {
//         return res
//           .status(403)
//           .json({ message: "You dont have any campus assigned" });
//       }
//       filter.campus = campusData._id;
//     } else if (role === "teacher") {
//       const filterOr = [];

//       const mainClass = await Class.findOne({
//         classTeacher: userId,
//         isActive: true,
//       });
//       if (mainClass) {
//         filterOr.push({ class: mainClass._id });
//       }

//       const teacherAssign = await TeacherAssignment.findOne({
//         teacher: userId,
//         isActive: true,
//       }).populate({
//         path: "assignments",
//         match: { isActive: true },
//         select: "campus class subject",
//       });

//       if (teacherAssign && teacherAssign.assignments.length > 0) {
//         teacherAssign.assignments.forEach((a) => {
//           filterOr.push({
//             campus: a.campus.toString(),
//             class: a.class.toString(),
//             subject: a.subject.toString(),
//           });
//         });
//       }

//       if (filterOr.length === 0) {
//         return res.status(403).json({
//           message: "You don't have any active class or assignments",
//         });
//       }

//       filter.$or = filterOr;
//     } else if (role === "super-admin") {
//     }
//     let filterExam = {};
//     if (academicSession) {
//       filterExam.academicSession = academicSession;
//     }
//     if (term) {
//       filterExam.term = term;
//     }
//     if (classId) filter.class = classId;
//     if (subjectId) filter.subject = subjectId;
//     if (examType) {
//       const exam = await Exam.findOne({ type: examType });
//       if (exam) filter.exam = exam._id;
//     }
//     if (Object.keys(filterExam).length > 0) {
//       const exams = await Exam.find(filterExam).select("_id");
//       filter.exam = { $in: exams.map((e) => e._id) };
//     }
//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const TotalScores = await Score.countDocuments(filter);
//     const scores = await Score.find(filter)
//       .populate("student", "name rollNumber")
//       .populate("class", "grade section")
//       .populate("subject", "name")
//       .populate("exam", "term type totalMarks")
//       .populate("campus", "name location")
//       .populate("enteredBy", "name role")
//       .skip(skip)
//       .limit(limit)
//       .sort({ marksObtained: -1 });

//     res.json({
//       totalScores: TotalScores,
//       page: parseInt(page),
//       limit: parseInt(limit),
//       scores,
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

export const updateScore = async (req, res) => {
  try {
    const { scoreId } = req.params;
    const { role, _id: userId } = req.user;
    const { marksObtained, remarks } = req.body;
    if (
      role !== "campus-admin" &&
      role !== "teacher" &&
      role !== "super-admin"
    ) {
      return res.status(403).json({
        message: "Forbidden: You're not allowed to perform this action",
      });
    }
    const score = await Score.findById(scoreId);
    if (!score) {
      return res.status(404).json({ message: "Score not found" });
    }
    if (role === "campus-admin") {
      const campusData = await Campus.findOne({ campusAdmin: userId });
      if (!campusData) {
        return res
          .status(403)
          .json({ message: "You dont have any campus assigned" });
      }
      if (campusData._id.toString() !== score.campus.toString()) {
        return res
          .status(403)
          .json({ message: "You can only update scores for your own campus" });
      }
    } else if (role === "teacher") {
      const teacherAssign = await TeacherAssignment.findOne({
        teacher: userId,
        isActive: true,
      }).populate({
        path: "assignments",
        match: { isActive: true },
        select: "campus class subject",
      });
      if (!teacherAssign) {
        return res
          .status(403)
          .json({ message: "You don't have any active assignments" });
      }
      const assigned = teacherAssign.assignments.some(
        (a) =>
          a.campus.toString() === score.campus.toString() &&
          a.class.toString() === score.class.toString() &&
          a.subject.toString() === score.subject.toString()
      );
      if (!assigned) {
        return res.status(403).json({
          message:
            "You can only update scores for your assigned campus, class, and subject",
        });
      }
    }
    const updatedScore = await Score.findByIdAndUpdate(
      scoreId,
      { marksObtained, remarks },
      { new: true, runValidators: true }
    );
    res.json({ message: "Score updated successfully", score: updatedScore });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteScore = async (req, res) => {
  try {
    const { scoreId } = req.params;
    const { role, _id: userId } = req.user;
    if (role !== "campus-admin" && role !== "super-admin") {
      return res.status(403).json({
        message: "Forbidden: You're not allowed to perform this action",
      });
    }
    const score = await Score.findById(scoreId);
    if (!score) {
      return res.status(404).json({ message: "Score not found" });
    }
    if (role === "super-admin") {
    } else if (role === "campus-admin") {
      const campusData = await Campus.findOne({ campusAdmin: userId });
      if (!campusData) {
        return res
          .status(403)
          .json({ message: "You dont have any campus assigned" });
      }
      if (campusData._id.toString() !== score.campus.toString()) {
        return res
          .status(403)
          .json({ message: "You can only delete scores for your own campus" });
      }
    }
    await Score.findByIdAndDelete(scoreId);
    res.json({ message: "Score deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
