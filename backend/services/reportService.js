import Attendance from "../models/StudentAttendance.js";
import { sendEmailReport } from "../utils/nodemailer.js";

export const generateMonthlyAttendanceReports = async () => {
  const now = new Date();
  const previousMonth = now.getMonth() - 1;
  const year = previousMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = previousMonth < 0 ? 11 : previousMonth;

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 1);

  const reports = await Attendance.aggregate([
    { $match: { date: { $gte: startDate, $lt: endDate } } },
    {
      $lookup: {
        from: "studentenrollments",
        localField: "enrollment",
        foreignField: "_id",
        as: "enrollment",
      },
    },
    { $unwind: "$enrollment" },
    {
      $lookup: {
        from: "users",
        localField: "enrollment.student",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $group: {
        _id: {
          studentId: "$student._id",
          studentName: "$student.name",
          email: "$student.email",
        },
        presentDays: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
        absentDays: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        leaveDays: {
          $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        totalDays: { $add: ["$presentDays", "$absentDays"] }, // exclude leave
        attendancePercentage: {
          $round: [
            {
              $cond: [
                { $eq: [{ $add: ["$presentDays", "$absentDays"] }, 0] },
                0,
                {
                  $multiply: [
                    {
                      $divide: ["$presentDays", { $add: ["$presentDays", "$absentDays"] }],
                    },
                    100,
                  ],
                },
              ],
            },
            2,
          ],
        },
      },
    },
  ]);

  for (const r of reports) {
    await sendEmailReport(
      {
        totalDays: r.totalDays,
        presentDays: r.presentDays,
        absentDays: r.absentDays,
        leaveDays: r.leaveDays,
        attendancePercentage: r.attendancePercentage,
        studentName: r._id.studentName,
      },
      month,
      year,
      r._id.email
    );
  }
};

export const checkLowAttendanceAndNotify = async () => {
  const now = new Date();
  const previousMonth = now.getMonth() - 1;
  const year = previousMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = previousMonth < 0 ? 11 : previousMonth;

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 1);

  const reports = await Attendance.aggregate([
    { $match: { date: { $gte: startDate, $lt: endDate } } },
    {
      $lookup: {
        from: "studentenrollments",
        localField: "enrollment",
        foreignField: "_id",
        as: "enrollment",
      },
    },
    { $unwind: "$enrollment" },
    {
      $lookup: {
        from: "users",
        localField: "enrollment.student",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $group: {
        _id: {
          studentId: "$student._id",
          studentName: "$student.name",
          email: "$student.email",
        },
        presentDays: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
        absentDays: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        leaveDays: {
          $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        totalDays: { $add: ["$presentDays", "$absentDays"] },
        attendancePercentage: {
          $round: [
            {
              $cond: [
                { $eq: [{ $add: ["$presentDays", "$absentDays"] }, 0] },
                0,
                {
                  $multiply: [
                    {
                      $divide: ["$presentDays", { $add: ["$presentDays", "$absentDays"] }],
                    },
                    100,
                  ],
                },
              ],
            },
            2,
          ],
        },
      },
    },
  ]);

  for (const r of reports) {
    if (r.attendancePercentage < 75) {
      await sendEmailReport(
        r,
        month,
        year,
        r._id.email
      );
    }
  }
};
