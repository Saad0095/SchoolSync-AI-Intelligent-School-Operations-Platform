import mongoose from "mongoose";
import Campus from "../models/Campus.js";
import StudentAttendance from "../models/StudentAttendance.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Class from "../models/Class.js";
import logger from "../utils/logger.js";

export const markBulkStudentAttendance = async (req, res) => {
  try {
    const { classId, records, term, academicSession } = req.body; // [{ rollNumber, status }, ...]

    if (!classId || !records?.length) {
      return res
        .status(400)
        .json({ message: "Class ID and records are required" });
    }

    if (!term || !academicSession) {
      return res
        .status(400)
        .json({ message: "Term and academic year are required" });
    }

    let classRec;

    if (req.user.role === "teacher") {
      const teacherAssignment = await Class.findOne({
        classTeacher: req.user._id,
      });

      if (!teacherAssignment)
        return res
          .status(403)
          .json({ message: "You are not assigned to any class" });

      classRec = await Class.findById(teacherAssignment._id);
      if (!classRec)
        return res.status(404).json({ message: "Assigned class not found" });
    } else {
      classRec = await Class.findById(classId);
      if (!classRec)
        return res.status(404).json({ message: "Class not found" });
    }

    // Only class teacher or admin can mark
    if (
      req.user.role === "teacher" &&
      String(classRec.classTeacher) !== String(req.user._id)
    ) {
      return res
        .status(403)
        .json({ message: "Only Class Teacher or Admin can mark attendance" });
    }

    const now = new Date();
    const targetDate = req.body.date ? new Date(req.body.date) : new Date();
    
    if (targetDate.getDay() === 0) {
      return res
        .status(400)
        .json({ message: "Attendance cannot be marked on Sundays" });
    }

    const today = new Date(targetDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendanceResults = [];

    for (let rec of records) {
      const { rollNumber, status } = rec;

      const student = await StudentEnrollment.findOne({
        rollNumber,
        class: classRec._id,
      });

      if (!student) {
        attendanceResults.push({ rollNumber, message: "Student not found" });
        continue;
      }

      const alreadyMarked = await StudentAttendance.findOne({
        enrollment: student._id,
        class: classRec._id,
        date: { $gte: today, $lt: tomorrow },
      });

      if (alreadyMarked) {
        alreadyMarked.status = status;
        await alreadyMarked.save();

        attendanceResults.push({
          rollNumber,
          status,
          message: "Updated",
          id: alreadyMarked._id,
        });
        continue;
      }
      const attendance = await StudentAttendance.create({
        enrollment: student._id,
        status,
        class: classRec._id,
        campus: classRec.campus,
        markedBy: req.user._id,
        term,
        academicSession,
        date: targetDate,
      });

      attendanceResults.push({
        rollNumber,
        status,
        message: "Marked",
        id: attendance._id,
      });
    }

    logger.info(
      `Bulk attendance marked by ${req.user._id} for class ${classId}`
    );

    res.status(201).json({
      message: "Bulk student attendance processed",
      results: attendanceResults,
    });
  } catch (err) {
    logger.error(`Error marking bulk attendance: ${err.message}`);
    res.status(500).json({
      message: "Error marking bulk attendance",
      error: err.message,
    });
  }
};

export const getAllStudentsAttendance = async (req, res) => {
  try {
    const {
      status,
      from,
      to,
      classId,
      term,
      academicSession,
      pageNumber,
      pageSize,
    } = req.query;
    const page = parseInt(pageNumber) || 1;
    const limit = parseInt(pageSize) || 10;

    const match = {};

    let classRec;
    if (req.user.role === "teacher") {
      const teacherAssignment = await Class.findOne({
        classTeacher: req.user._id,
      });

      if (!teacherAssignment)
        return res
          .status(403)
          .json({ message: "You are not assigned to any class" });

      classRec = await Class.findById(teacherAssignment._id);
      if (!classRec)
        return res.status(404).json({ message: "Assigned class not found" });
      match.class = classRec._id;
      match.campus = classRec.campus;
    } else {
      if (classId) match.class = new mongoose.Types.ObjectId(classId);
      const campus = await Campus.findOne({ campusAdmin: req.user._id });
      if (campus) match.campus = new mongoose.Types.ObjectId(campus._id);
    }

    if (status) match.status = status;
    if (term) match.term = term;
    if (academicSession) match.academicSession = academicSession;

    if (from && to) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      match.date = { $gte: fromDate, $lte: toDate };
    }

    logger.info(
      `Fetching student attendance with filters: ${JSON.stringify(match)}`
    );

    const result = await StudentAttendance.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "classes",
          localField: "class",
          foreignField: "_id",
          as: "classDetails",
        },
      },
      { $unwind: "$classDetails" },
      {
        $lookup: {
          from: "studentenrollments",
          localField: "enrollment",
          foreignField: "_id",
          as: "enrollmentDetails",
        },
      },
      { $unwind: "$enrollmentDetails" },
      {
        $lookup: {
          from: "users",
          localField: "enrollmentDetails.student",
          foreignField: "_id",
          as: "studentDetails",
        },
      },
      { $unwind: "$studentDetails" },
      {
        $facet: {
          records: [
            {
              $project: {
                _id: 1,
                date: 1,
                status: 1,
                term: 1,
                academicSession: 1,
                class: 1,
                campus: 1,
                "classDetails.grade": 1,
                "classDetails.section": 1,
                "studentDetails._id": 1,
                "studentDetails.name": 1,
                "studentDetails.email": 1,
                "studentDetails.contact": 1,
                "enrollmentDetails.rollNumber": 1,
              },
            },
            { $sort: { date: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          counts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const records = result[0].records;
    const countArray = result[0].counts;

    if (!records.length) {
      return res.json({
        total: 0,
        countSummary: { present: 0, absent: 0, leave: 0 },
        page: pageNumber,
        records: [],
      });
    }

    const countSummary = countArray.reduce(
      (acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      },
      { present: 0, absent: 0, leave: 0 }
    );

    res.json({
      total: records.length,
      countSummary,
      page: pageNumber,
      records,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching student attendance",
      error: err.message,
    });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const { from, to, status, term, academicSession, pageNumber, pageSize } =
      req.query;
    const page = parseInt(pageNumber) || 1;
    const limit = parseInt(pageSize) || 10;
    const studentId = req.params.studentId;

    // Security: students can only view their own attendance
    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: "You can only view your own attendance" });
    }

    const match = {
      "enrollmentDetails.student": new mongoose.Types.ObjectId(studentId),
    };

    if (status) match.status = status;
    if (term) match.term = term;
    if (academicSession) match.academicSession = academicSession;

    if (from && to) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      match.date = { $gte: fromDate, $lte: toDate };
    }

    const result = await StudentAttendance.aggregate([
      {
        $lookup: {
          from: "studentenrollments",
          localField: "enrollment",
          foreignField: "_id",
          as: "enrollmentDetails",
        },
      },
      { $unwind: "$enrollmentDetails" },
      {
        $lookup: {
          from: "users",
          localField: "enrollmentDetails.student",
          foreignField: "_id",
          as: "studentDetails",
        },
      },
      { $unwind: "$studentDetails" },
      { $match: match },
      {
        $facet: {
          records: [
            {
              $project: {
                _id: 1,
                date: 1,
                status: 1,
                class: 1,
                campus: 1,
                "studentDetails.name": 1,
                "studentDetails.email": 1,
                "enrollmentDetails.rollNumber": 1,
              },
            },
            { $sort: { date: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          counts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const records = result[0].records;
    const countArray = result[0].counts;

    if (!records.length) {
      return res.json({
        total: 0,
        countSummary: { present: 0, absent: 0, leave: 0 },
        page: pageNumber,
        records: [],
      });
    }

    const countSummary = countArray.reduce(
      (acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      },
      { present: 0, absent: 0, leave: 0 }
    );

    res.json({
      total: records.length,
      page: pageNumber,
      countSummary,
      records,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching student attendance",
      error: err.message,
    });
  }
};

export const updateStudentAttendance = async (req, res) => {
  try {
    const updated = await StudentAttendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Student attendance updated!" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating attendance", error: err.message });
  }
};

export const deleteStudentAttendance = async (req, res) => {
  try {
    const deleted = await StudentAttendance.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Student attendance deleted!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting attendance", error: err.message });
  }
};
