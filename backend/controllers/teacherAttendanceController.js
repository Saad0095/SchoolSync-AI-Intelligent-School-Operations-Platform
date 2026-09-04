import mongoose from "mongoose";
import TeacherAttendance from "../models/TeacherAttendance.js";
import Campus from "../models/Campus.js";
import TeacherAssignment from "../models/TeacherAssignment.js";

/**
 * Auto-derive term and academic session from a given date.
 * Jul-Dec => FirstTerm, Jan-Jun => SecondTerm.
 * Academic session runs Jul–Jun (e.g. Jul 2025 => "2025-2026").
 */
const deriveTermAndSession = (date = new Date()) => {
  const month = date.getMonth(); // 0-based
  const year = date.getFullYear();
  const term = month >= 6 ? "FirstTerm" : "SecondTerm"; // Jul+ = FirstTerm
  const academicSession = month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  return { term, academicSession };
};

export const markTeacherAttendance = async (req, res) => {
  try {
    const { teacher, status, campus, term: bodyTerm, academicSession: bodySession } = req.body;

    const now = new Date();

    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0) {
      return res.status(400).json({ error: "Attendance cannot be marked on Sundays" });
    }

    const teacherId = req.user?.role === "teacher" ? req.user._id : teacher;
    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required" });
    }

    if (req.user.role === "teacher" && teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized to mark attendance for others" });
    }

    // Check campus attendance mode — block self-marking if mode is "admin"
    if (req.user.role === "teacher") {
      const ta = await TeacherAssignment
        .findOne({ teacher: req.user._id, isActive: true })
        .populate({ path: "assignments", select: "campus" });
      const campusId = ta?.assignments?.[0]?.campus;
      if (campusId) {
        const campusDoc = await Campus.findById(campusId).select("attendanceMode");
        if (campusDoc?.attendanceMode === "admin") {
          return res.status(403).json({ error: "Your campus uses admin-managed attendance. Please contact your campus administrator." });
        }
      }
    }

    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const existing = await TeacherAttendance.findOne({
      teacher: teacherId,
      date: startOfDay,
    });

    if (existing) {
      return res.status(400).json({ error: "Already checked in today" });
    }

    let campusId = campus;
    if (campusId === "temp") {
      campusId = undefined;
    }
    
    if (!campusId && req.user.role === "campus-admin") {
      const campusDoc = await Campus.findOne({ campusAdmin: req.user._id });
      if (campusDoc) campusId = campusDoc._id;
    }

    // Derive term and session (use body values if provided, otherwise auto-derive)
    const { term: derivedTerm, academicSession: derivedSession } = deriveTermAndSession(now);
    const recordTerm = bodyTerm || derivedTerm;
    const recordSession = bodySession || derivedSession;

    const attendance = await TeacherAttendance.create({
      teacher: teacherId,
      status,
      campus: campusId,
      date: startOfDay,
      checkIn: new Date(),
      markedBy: req.user._id,
      term: recordTerm,
      academicSession: recordSession,
    });

    res.status(201).json({
      message: "Check-in successful!",
      attendance,
    });
  } catch (err) {
    res.status(400).json({
      message: "Error marking teacher attendance",
      error: err.message,
    });
  }
};


export const teacherCheckOut = async (req, res) => {
  try {
    const teacherId =
      req.user?.role === "teacher" ? req.user._id : req.body.teacher;

    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required" });
    }

    if (req.user.role === "teacher" && teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized to mark attendance for others" });
    }

    const now = new Date();
    // const hours = now.getHours();

    // if (hours < 9 || hours > 21) {
    //   return res
    //     .status(400)
    //     .json({ error: "Check-out can only be done between 9:00 AM and 9:00 PM" });
    // }

    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const attendance = await TeacherAttendance.findOne({
      teacher: teacherId,
      date: startOfDay,
    });

    if (!attendance) {
      return res.status(404).json({ error: "No check-in found for today" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: "Already checked out today" });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.json({ message: "Check-out successful!", attendance });
  } catch (err) {
    res.status(500).json({
      message: "Error marking check-out",
      error: err.message,
    });
  }
};


export const getAllTeacherAttendance = async (req, res) => {
  try {
    const { status, from, to, term, academicSession, pageNumber, pageSize } = req.query;
    const page = parseInt(pageNumber) || 1;
    const limit = parseInt(pageSize) || 10;

    const match = {};

    if (req.user.role === "teacher") {
      match.teacher = new mongoose.Types.ObjectId(req.user._id);
    } else {
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

    const records = await TeacherAttendance.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "teacher",
          foreignField: "_id",
          as: "teacherDetails",
        },
      },
      { $unwind: "$teacherDetails" },
      {
        $project: {
          _id: 1,
          date: 1,
          status: 1,
          campus: 1,
          term: 1,
          academicSession: 1,
          checkIn: 1,
          checkOut: 1,
          "teacherDetails._id": 1,
          "teacherDetails.name": 1,
          "teacherDetails.email": 1,
          "teacherDetails.contact": 1,
        },
      },
      { $sort: { date: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    if (!records.length)
      return res.status(404).json({ message: "No attendance found" });

    res.json(records);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching teacher attendance",
      error: err.message,
    });
  }
};

export const getTeacherAttendance = async (req, res) => {
  try {
    const { from, to, pageNumber, pageSize, status } = req.query;
    const page = parseInt(pageNumber) || 1;
    const limit = parseInt(pageSize) || 10;

    const campus = await Campus.findOne({ campusAdmin: req.user._id });
    const match = {
      teacher: new mongoose.Types.ObjectId(req.params.teacherId),
    };

    if (campus) match.campus = new mongoose.Types.ObjectId(campus._id);
    if (status) match.status = status;
    if (from && to) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      match.date = { $gte: fromDate, $lte: toDate };
    }

    const result = await TeacherAttendance.aggregate([
      { $match: match },
      {
        $facet: {
          records: [
            // {
            //   $lookup: {
            //     from: "users",
            //     localField: "teacher",
            //     foreignField: "_id",
            //     as: "teacherDetails",
            //   },
            // },
            // { $unwind: "$teacherDetails" },
            {
              $project: {
                _id: 1,
                date: 1,
                status: 1,
                campus: 1,
                checkIn: 1,
                checkOut: 1,
                // "teacherDetails.name": 1,
                // "teacherDetails.email": 1,
                // "teacherDetails.contact": 1,
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

    if (!records.length)
      return res.status(404).json({ message: "No attendance found" });

    const countSummary = countArray.reduce(
      (acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      },
      { present: 0, absent: 0, leave: 0 }
    );

    res.json({
      records,
      countSummary,
      total: records.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching teacher attendance",
      error: err.message,
    });
  }
};

export const updateTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await TeacherAttendance.findByIdAndUpdate(
      id,
      { status: req.body?.status },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Teacher attendance updated!" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating attendance", error: err.message });
  }
};

export const deleteTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TeacherAttendance.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Teacher attendance deleted!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting attendance", error: err.message });
  }
};

export const markBulkTeacherAttendance = async (req, res) => {
  try {
    const { records, term: bodyTerm, academicSession: bodySession } = req.body; // [{ teacherId, status }, ...]

    if (!records?.length) {
      return res.status(400).json({ message: "Records are required" });
    }

    const campusDoc = await Campus.findOne({ campusAdmin: req.user._id });
    if (!campusDoc && req.user.role === "campus-admin") {
      return res.status(403).json({ message: "Campus not found for admin" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Derive term and session for bulk records
    const { term: derivedTerm, academicSession: derivedSession } = deriveTermAndSession(today);
    const bulkTerm = bodyTerm || derivedTerm;
    const bulkSession = bodySession || derivedSession;

    const attendanceResults = [];

    for (let rec of records) {
      const { teacherId, status } = rec;

      const alreadyMarked = await TeacherAttendance.findOne({
        teacher: teacherId,
        date: { $gte: today, $lt: tomorrow },
      });

      if (alreadyMarked) {
        alreadyMarked.status = status;
        await alreadyMarked.save();
        attendanceResults.push({ teacherId, status, message: "Updated" });
        continue;
      }

      await TeacherAttendance.create({
        teacher: teacherId,
        status,
        campus: campusDoc ? campusDoc._id : undefined,
        markedBy: req.user._id,
        date: today,
        checkIn: status === "present" ? new Date() : undefined,
        term: bulkTerm,
        academicSession: bulkSession,
      });

      attendanceResults.push({ teacherId, status, message: "Marked" });
    }

    res.status(201).json({ message: "Bulk teacher attendance processed", results: attendanceResults });
  } catch (err) {
    res.status(500).json({ message: "Error marking bulk attendance", error: err.message });
  }
};
