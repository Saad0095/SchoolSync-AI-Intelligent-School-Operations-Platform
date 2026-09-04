import mongoose from "mongoose";
import Campus from "../models/Campus.js";
import Score from "../models/Score.js";
import User from "../models/User.js";
import Class from "../models/Class.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import StudentAttendance from "../models/StudentAttendance.js";
import Exam from "../models/Exam.js";
import TeacherAttendance from "../models/TeacherAttendance.js";
import TeacherAssignment from "../models/TeacherAssignment.js";

export const getOverviewStats = async (req, res) => {
  try {
    const { from, to, campusId } = req.query;
    let filter = {};

    if (req.user.role === "campus-admin") {
      filter.createdBy = req.user._id;
    } else if (campusId) {
      const campus = await Campus.findById(campusId);
      if (!campus) return res.status(404).json({ message: "Campus not found" });
      filter.createdBy = campus.campusAdmin;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const [campusCount, studentCount, teacherCount] = await Promise.all([
      req.user.role === "super-admin" ? Campus.countDocuments() : 1,
      User.countDocuments({
        role: "student",
        isActive: true,
        ...filter,
      }),
      User.countDocuments({
        role: "teacher",
        isActive: true,
        ...filter,
      }),
    ]);

    return res.status(200).json({
      data: { campusCount, studentCount, teacherCount },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTopPerformers = async (req, res) => {
  try {
    const { campusId, classId, academicSession, term } = req.query;
    let matchStage = {};

    if (req.user.role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: req.user._id });
      if (!campus) return res.status(404).json({ message: "Campus not found" });
      matchStage.campus = campus._id;

      if (classId) matchStage.class = new mongoose.Types.ObjectId(classId);
    } else {
      if (campusId) matchStage.campus = new mongoose.Types.ObjectId(campusId);
      if (classId) matchStage.class = new mongoose.Types.ObjectId(classId);
    }

    const topPerformers = await Score.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam",
        },
      },
      { $unwind: "$exam" },
      ...(academicSession || term
        ? [
            {
              $match: {
                ...(academicSession && {
                  "exam.academicSession": academicSession,
                }),
                ...(term && { "exam.term": term }),
              },
            },
          ]
        : []),
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "campus",
          localField: "campus",
          foreignField: "_id",
          as: "campus",
        },
      },
      { $unwind: "$campus" },
      {
        $lookup: {
          from: "classes",
          localField: "class",
          foreignField: "_id",
          as: "class",
        },
      },
      { $unwind: "$class" },
      {
        $group: {
          _id: {
            campusId: "$campus._id",
            campusName: "$campus.name",
            studentId: "$student._id",
            studentName: "$student.name",
            classId: "$class._id",
            classGrade: "$class.grade",
            classSection: "$class.section",
          },
          totalMarks: { $sum: "$marksObtained" },
          avgMarks: { $avg: "$marksObtained" },
          examCount: { $sum: 1 },
        },
      },
      {
        $addFields: {
          avgPercentage: {
            $round: [{ $divide: ["$totalMarks", "$examCount"] }, 2],
          },
        },
      },
      { $sort: { avgMarks: -1 } },
      {
        $group: {
          _id: {
            campusId: "$_id.campusId",
            campusName: "$_id.campusName",
          },
          topStudents: {
            $push: {
              studentId: "$_id.studentId",
              name: "$_id.studentName",
              avgMarks: "$avgMarks",
              avgPercentage: "$avgPercentage",
              classId: "$_id.classId",
              classGrade: "$_id.classGrade",
              classSection: "$_id.classSection",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          campusId: "$_id.campusId",
          campusName: "$_id.campusName",
          topStudents: { $slice: ["$topStudents", 3] },
        },
      },
    ]);

    let finalData = topPerformers;
    if (req.user.role === "super-admin" && !campusId) {
      const allCampuses = await Campus.find({}, "_id name");
      finalData = allCampuses.map((c) => {
        const found = topPerformers.find(
          (p) => p.campusId.toString() === c._id.toString()
        );
        return (
          found || {
            campusId: c._id,
            campusName: c.name,
            topStudents: [],
          }
        );
      });
    }

    const firstCampus = finalData[0];
    const firstStudent = firstCampus?.topStudents?.[0];
    const classLabel =
      firstStudent && firstStudent.classGrade && firstStudent.classSection
        ? `${firstStudent.classGrade}${firstStudent.classSection}`
        : "All";

    res.status(200).json({
      filtersApplied: {
        academicSession: academicSession || "All",
        term: term || "All",
        class: classLabel,
      },
      data: finalData,
    });
  } catch (error) {
    console.error("Error in getting Top Performers:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getDropRatio = async (req, res) => {
  try {
    const { from, to, campusId } = req.query;
    const match = { role: "student" };

    if (req.user.role === "campus-admin") {
      match.createdBy = req.user._id;
    } else if (campusId) {
      const campus = await Campus.findById(campusId);
      if (!campus) return res.status(404).json({ message: "Campus not found" });
      match.createdBy = campus.campusAdmin;
    }

    if (from && to)
      match.createdAt = { $gte: new Date(from), $lte: new Date(to) };

    const totalStudents = await User.countDocuments(match);
    const inactiveStudents = await User.countDocuments({
      ...match,
      isActive: false,
    });

    const dropRatio =
      totalStudents === 0 ? 0 : (inactiveStudents / totalStudents) * 100;

    res.status(200).json({
      data: {
        totalStudents,
        inactiveStudents,
        dropRatio: dropRatio.toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCampusComparison = async (req, res) => {
  try {
    const comparison = await Score.aggregate([
      {
        $lookup: {
          from: "campus",
          localField: "campus",
          foreignField: "_id",
          as: "campus",
        },
      },
      { $unwind: "$campus" },
      {
        $group: {
          _id: { campusId: "$campus._id", campusName: "$campus.name" },
          averageResult: { $avg: "$marksObtained" },
          totalExams: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          campusId: "$_id.campusId",
          campusName: "$_id.campusName",
          averageResult: { $round: ["$averageResult", 2] },
        },
      },
      { $sort: { averageResult: -1 } },
    ]);

    res.status(200).json({ data: comparison });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= TEACHER DASHBOARD ENDPOINTS =============

export const getTeacherOverview = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get teacher's assigned class (as class teacher)
    const assignedClass = await Class.findOne({ classTeacher: teacherId })
      .populate("subjects", "name")
      .populate("campus", "name");

    // Get teacher's subject assignments (other classes they teach)
    const teacherAssignments = await TeacherAssignment.findOne({
      teacher: teacherId,
      isActive: true,
    }).populate({
      path: "assignments",
      match: { isActive: true },
      populate: [
        { path: "campus", select: "name" },
        { path: "class", select: "grade section" },
        { path: "subject", select: "name" },
      ],
    });

    // Get all classes and subjects the teacher is associated with
    let allClasses = [];
    let allSubjects = new Set();
    let classSubjectsMap = {}; // Map to store subjects per class

    // Add assigned class with its subjects
    if (assignedClass) {
      const classSubjects = assignedClass.subjects?.map((s) => s.name) || [];
      
      allClasses.push({
        _id: assignedClass._id,
        grade: assignedClass.grade,
        section: assignedClass.section,
        isClassTeacher: true,
        campus: assignedClass.campus,
        subjects: classSubjects,
      });

      classSubjectsMap[assignedClass._id.toString()] = classSubjects;
      classSubjects.forEach((s) => allSubjects.add(s));
    }

    // Add classes from teacher assignments
    if (teacherAssignments?.assignments?.length > 0) {
      // Group assignments by class
      const assignmentsByClass = {};
      
      teacherAssignments.assignments.forEach((assignment) => {
        const classId = assignment.class._id.toString();
        if (!assignmentsByClass[classId]) {
          assignmentsByClass[classId] = {
            classId: assignment.class._id,
            grade: assignment.class.grade,
            section: assignment.class.section,
            campus: assignment.campus,
            subjects: [],
          };
        }
        if (assignment.subject) {
          assignmentsByClass[classId].subjects.push(assignment.subject.name);
          allSubjects.add(assignment.subject.name);
        }
      });

      // Add to allClasses if not already there
      Object.values(assignmentsByClass).forEach((classData) => {
        const classExists = allClasses.some(
          (c) => c._id.toString() === classData.classId.toString()
        );
        if (!classExists) {
          allClasses.push({
            _id: classData.classId,
            grade: classData.grade,
            section: classData.section,
            isClassTeacher: false,
            campus: classData.campus,
            subjects: classData.subjects,
          });
        }
      });
    }

    // Get total students in main assigned class
    const totalStudents = assignedClass
      ? await StudentEnrollment.countDocuments({
          class: assignedClass._id,
          isActive: true,
        })
      : 0;

    const activeStudents = assignedClass
      ? await StudentEnrollment.countDocuments({
          class: assignedClass._id,
          isActive: true,
        })
      : 0;

    res.status(200).json({
      data: {
        assignedClass: assignedClass
          ? {
              _id: assignedClass._id,
              grade: assignedClass.grade,
              section: assignedClass.section,
              campus: assignedClass.campus,
              totalStudents,
              activeStudents,
            }
          : null,
        allClasses,
        allSubjects: Array.from(allSubjects),
        isClassTeacher: !!assignedClass,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClassPerformance = async (req, res) => {
  try {
    const { term, academicSession } = req.query;
    const teacherId = req.user._id;

    // Get teacher's assigned class
    const assignedClass = await Class.findOne({ classTeacher: teacherId });
    if (!assignedClass) {
      return res.status(404).json({ message: "No class assigned to this teacher" });
    }

    // Build match stage
    let matchStage = {
      class: assignedClass._id,
    };

    if (term) matchStage.exam = { term };
    if (academicSession) matchStage.academicSession = academicSession;

    // Get all scores for the class
    const performanceData = await Score.aggregate([
      { $match: { class: assignedClass._id } },
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "examDetails",
        },
      },
      { $unwind: "$examDetails" },
      ...(term || academicSession
        ? [
            {
              $match: {
                ...(term && { "examDetails.term": term }),
                ...(academicSession && {
                  "examDetails.academicSession": academicSession,
                }),
              },
            },
          ]
        : []),
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "studentDetails",
        },
      },
      { $unwind: "$studentDetails" },
      {
        $lookup: {
          from: "studentenrollments",
          localField: "student",
          foreignField: "student",
          as: "enrollmentDetails",
        },
      },
      { $unwind: "$enrollmentDetails" },
      {
        $group: {
          _id: "$student",
          studentName: { $first: "$studentDetails.name" },
          rollNumber: { $first: "$enrollmentDetails.rollNumber" },
          totalMarks: { $sum: "$marksObtained" },
          examCount: { $sum: 1 },
          avgMarks: { $avg: "$marksObtained" },
        },
      },
      {
        $addFields: {
          avgPercentage: { $round: [{ $divide: ["$avgMarks", 100] }, 2] },
        },
      },
      { $sort: { avgMarks: -1 } },
    ]);

    // Calculate class average
    const classAverage =
      performanceData.length > 0
        ? (
            performanceData.reduce((sum, s) => sum + s.avgMarks, 0) /
            performanceData.length
          ).toFixed(2)
        : 0;

    // Get top performers
    const topPerformers = performanceData.slice(0, 5);

    // Count exams
    const examCount = await Exam.countDocuments({
      class: assignedClass._id,
      ...(term && { term }),
      ...(academicSession && { academicSession }),
    });

    res.status(200).json({
      data: {
        classAverage: parseFloat(classAverage),
        topPerformers,
        studentCount: performanceData.length,
        examsCompleted: examCount,
        allStudentPerformance: performanceData,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceOverview = async (req, res) => {
  try {
    const { from, to } = req.query;
    const teacherId = req.user._id;

    // Build match stage for teacher attendance
    let matchStage = {
      teacher: new mongoose.Types.ObjectId(teacherId),
    };

    if (from && to) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      matchStage.date = { $gte: fromDate, $lte: toDate };
    }

    // Get attendance summary
    const attendanceSummary = await TeacherAttendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get detailed attendance records
    const attendanceRecords = await TeacherAttendance.aggregate([
      { $match: matchStage },
      { $sort: { date: -1 } },
      {
        $project: {
          _id: 1,
          status: 1,
          date: 1,
          checkIn: 1,
          checkOut: 1,
        },
      },
    ]);

    // Format summary
    const summary = {
      present: 0,
      absent: 0,
      leave: 0,
    };

    attendanceSummary.forEach((item) => {
      summary[item._id] = item.count;
    });

    // Calculate overall attendance percentage
    const totalRecords =
      summary.present + summary.absent + summary.leave;
    const overallPercentage =
      totalRecords > 0
        ? ((summary.present / totalRecords) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      data: {
        summary,
        overallAttendancePercentage: parseFloat(overallPercentage),
        attendanceRecords,
        totalDays: totalRecords,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeacherQuickStats = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get teacher's assigned class
    const assignedClass = await Class.findOne({ classTeacher: teacherId });
    if (!assignedClass) {
      return res.status(404).json({ message: "No class assigned to this teacher" });
    }

    // Get total students
    const totalStudents = await StudentEnrollment.countDocuments({
      class: assignedClass._id,
    });

    const activeStudents = await StudentEnrollment.countDocuments({
      class: assignedClass._id,
      isActive: true,
    });

    // Get average attendance
    const attendanceStats = await StudentAttendance.aggregate([
      { $match: { class: assignedClass._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    let averageAttendance = 0;
    const totalAttendance =
      attendanceStats.reduce((sum, item) => sum + item.count, 0) || 0;
    if (totalAttendance > 0) {
      const presentCount =
        attendanceStats.find((item) => item._id === "present")?.count || 0;
      averageAttendance = parseFloat(
        ((presentCount / totalAttendance) * 100).toFixed(2)
      );
    }

    // Get average performance
    const performanceStats = await Score.aggregate([
      { $match: { class: assignedClass._id } },
      {
        $group: {
          _id: null,
          avgMarks: { $avg: "$marksObtained" },
        },
      },
    ]);

    const averagePerformance =
      performanceStats.length > 0
        ? parseFloat(performanceStats[0].avgMarks.toFixed(2))
        : 0;

    // Get exams count
    const examsScheduled = await Exam.countDocuments({
      class: assignedClass._id,
    });

    res.status(200).json({
      data: {
        classInfo: {
          grade: assignedClass.grade,
          section: assignedClass.section,
        },
        totalStudents,
        activeStudents,
        averageAttendance,
        averagePerformance,
        examsScheduled,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentOverview = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get current enrollment
    const enrollment = await StudentEnrollment.findOne({ student: studentId, isActive: true }).populate("class");
    if (!enrollment) {
      return res.status(200).json({
        data: {
          attendance: 0,
          averageMarks: 0,
          upcomingExams: 0,
          rank: 0,
        }
      });
    }

    // Attendance
    const attendanceStats = await StudentAttendance.aggregate([
      { $match: { enrollment: enrollment._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    let totalDays = 0;
    let presentDays = 0;
    attendanceStats.forEach(stat => {
      totalDays += stat.count;
      if (stat._id === "present") presentDays = stat.count;
    });
    
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Average Marks (true percentage: obtained / total per exam) & Rank
    const allScoresInClass = await Score.aggregate([
      { $match: { class: enrollment.class._id } },
      { $lookup: { from: "exams", localField: "exam", foreignField: "_id", as: "examData" } },
      { $unwind: "$examData" },
      {
        $group: {
          _id: "$student",
          totalObtained: { $sum: "$marksObtained" },
          totalPossible: { $sum: "$examData.totalMarks" },
        },
      },
      {
        $addFields: {
          percentage: {
            $cond: [
              { $gt: ["$totalPossible", 0] },
              { $multiply: [{ $divide: ["$totalObtained", "$totalPossible"] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { percentage: -1 } },
    ]);

    let averageMarks = 0;
    let rank = 0;

    const studentScore = allScoresInClass.find(s => s._id.toString() === studentId.toString());
    if (studentScore) {
      averageMarks = Math.round(studentScore.percentage);
      rank = allScoresInClass.findIndex(s => s._id.toString() === studentId.toString()) + 1;
    }

    // Upcoming Exams
    const upcomingExamsCount = await Exam.countDocuments({ class: enrollment.class._id });

    res.status(200).json({
      data: {
        attendance: attendancePercentage,
        averageMarks,
        upcomingExams: upcomingExamsCount,
        rank,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getParentOverview = async (req, res) => {
  try {
    const parentId = req.user._id;
    const children = req.user.parentOf || [];

    if (!children.length) {
      return res.status(200).json({
        data: { children: [], message: "No children linked to this account" },
      });
    }

    const childrenData = await Promise.all(
      children.map(async (childId) => {
        const child = await User.findById(childId).select("name email role isActive");
        if (!child) return null;

        const enrollment = await StudentEnrollment.findOne({ student: childId, isActive: true }).populate("class");
        if (!enrollment) return { child: { _id: child._id, name: child.name }, attendance: 0, averageMarks: 0, rank: 0, className: "Not enrolled" };

        // Attendance
        const attStats = await StudentAttendance.aggregate([
          { $match: { enrollment: enrollment._id } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        let totalDays = 0, presentDays = 0;
        attStats.forEach(s => { totalDays += s.count; if (s._id === "present") presentDays = s.count; });
        const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        // Marks & Rank
        const classScores = await Score.aggregate([
          { $match: { class: enrollment.class._id } },
          { $group: { _id: "$student", avgMarks: { $avg: "$marksObtained" } } },
          { $sort: { avgMarks: -1 } },
        ]);
        let avgMarks = 0, rank = 0;
        const myScore = classScores.find(s => s._id.toString() === childId.toString());
        if (myScore) {
          avgMarks = Math.round(myScore.avgMarks);
          rank = classScores.findIndex(s => s._id.toString() === childId.toString()) + 1;
        }

        // Upcoming exams
        const examCount = await Exam.countDocuments({ class: enrollment.class._id });

        return {
          child: { _id: child._id, name: child.name, email: child.email },
          className: `Grade ${enrollment.class.grade} - ${enrollment.class.section}`,
          attendance: attendancePct,
          averageMarks: avgMarks,
          rank,
          upcomingExams: examCount,
        };
      })
    );

    res.status(200).json({
      data: { children: childrenData.filter(Boolean) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
