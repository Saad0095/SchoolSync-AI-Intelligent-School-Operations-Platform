import FeeStructure from "../models/FeeStructure.js";
import FeeVoucher from "../models/FeeVoucher.js";
import Campus from "../models/Campus.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import User from "../models/User.js";
import Class from "../models/Class.js";
import logger from "../utils/logger.js";
import { sendNotification, sendBulkNotifications } from "../services/notificationService.js";
import { generateFeeVoucherPDF } from "../services/feePdfService.js";

/**
 * Helper: Resolve active campus for Campus Admin
 */
const getAdminCampus = async (userId) => {
  const campus = await Campus.findOne({ campusAdmin: userId, isActive: true });
  return campus;
};

/**
 * Helper: Generate unique voucher number
 */
const generateUniqueVoucherNumber = () => {
  const prefix = "VCH";
  const dateStr = new Date().toISOString().slice(0, 7).replace("-", ""); // e.g. 202608
  const randomStr = Math.floor(100000 + Math.random() * 900000); // 6 digit random
  return `${prefix}-${dateStr}-${randomStr}`;
};

/**
 * 1. CREATE FEE STRUCTURE (Campus Admin)
 */
export const createFeeStructure = async (req, res) => {
  try {
    const campus = await getAdminCampus(req.user._id);
    if (!campus) {
      return res.status(403).json({ message: "No active campus assigned to this admin." });
    }

    const { name, feeType, amount, frequency, dueDate, description, academicSession } = req.body;

    const newStructure = await FeeStructure.create({
      campus: campus._id,
      name,
      feeType: feeType || "tuition",
      amount,
      frequency: frequency || "monthly",
      dueDate: dueDate || null,
      description: description || "",
      academicSession: academicSession || "2025-2026",
      createdBy: req.user._id,
    });

    logger.info(`Fee structure created: ${name} (Campus: ${campus.name})`);
    res.status(201).json(newStructure);
  } catch (error) {
    logger.error(`Error creating fee structure: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * 2. GET FEE STRUCTURES (Campus Admin)
 */
export const getFeeStructures = async (req, res) => {
  try {
    const campus = await getAdminCampus(req.user._id);
    if (!campus) {
      return res.status(403).json({ message: "No active campus assigned to this admin." });
    }

    const structures = await FeeStructure.find({ campus: campus._id, isActive: true })
      .sort({ createdAt: -1 });

    res.json(structures);
  } catch (error) {
    logger.error(`Error fetching fee structures: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 3. UPDATE FEE STRUCTURE (Campus Admin)
 */
export const updateFeeStructure = async (req, res) => {
  try {
    const campus = await getAdminCampus(req.user._id);
    if (!campus) {
      return res.status(403).json({ message: "No active campus assigned to this admin." });
    }

    const { id } = req.params;
    const structure = await FeeStructure.findOne({ _id: id, campus: campus._id });
    if (!structure) {
      return res.status(404).json({ message: "Fee structure not found or access denied." });
    }

    const updated = await FeeStructure.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (error) {
    logger.error(`Error updating fee structure: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * 4. DELETE / TOGGLE FEE STRUCTURE (Campus Admin)
 */
export const deleteFeeStructure = async (req, res) => {
  try {
    const campus = await getAdminCampus(req.user._id);
    if (!campus) {
      return res.status(403).json({ message: "No active campus assigned to this admin." });
    }

    const { id } = req.params;
    const structure = await FeeStructure.findOne({ _id: id, campus: campus._id });
    if (!structure) {
      return res.status(404).json({ message: "Fee structure not found or access denied." });
    }

    structure.isActive = false;
    await structure.save();

    res.json({ message: "Fee structure deactivated successfully." });
  } catch (error) {
    logger.error(`Error deleting fee structure: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * 5. GENERATE VOUCHERS (Campus Admin - Single or Bulk Class)
 */
export const generateVouchers = async (req, res) => {
  try {
    const campus = await getAdminCampus(req.user._id);
    if (!campus) {
      return res.status(403).json({ message: "No active campus assigned to this admin." });
    }

    const { feeStructureId, classId, studentId, title, feeType, amount, dueDate, remarks } = req.body;

    let targetEnrollments = [];

    if (studentId) {
      // Single student generation
      const enrollment = await StudentEnrollment.findOne({
        student: studentId,
        campus: campus._id,
        isActive: true,
      });

      if (!enrollment) {
        return res.status(404).json({ message: "Student enrollment not found in your campus." });
      }
      targetEnrollments.push(enrollment);
    } else if (classId) {
      // Bulk generation for class
      const enrollments = await StudentEnrollment.find({
        class: classId,
        campus: campus._id,
        isActive: true,
      });

      if (enrollments.length === 0) {
        return res.status(404).json({ message: "No active students found in the selected class for your campus." });
      }
      targetEnrollments = enrollments;
    } else {
      return res.status(400).json({ message: "Please specify either a class or a student." });
    }

    const vouchersToCreate = [];
    const notificationRecipientIds = [];

    for (const enroll of targetEnrollments) {
      const voucherNum = generateUniqueVoucherNumber();
      vouchersToCreate.push({
        voucherNumber: voucherNum,
        campus: campus._id,
        student: enroll.student,
        studentEnrollment: enroll._id,
        class: enroll.class,
        feeStructure: feeStructureId || null,
        title: title || "Monthly Tuition Fee",
        feeType: feeType || "tuition",
        issueDate: new Date(),
        dueDate: new Date(dueDate),
        totalAmount: Number(amount),
        paidAmount: 0,
        remainingBalance: Number(amount),
        status: new Date(dueDate) < new Date() ? "overdue" : "pending",
        remarks: remarks || "",
        payments: [],
      });
      notificationRecipientIds.push(enroll.student.toString());
    }

    const createdVouchers = await FeeVoucher.insertMany(vouchersToCreate);

    // Dispatch real-time notifications to students
    if (notificationRecipientIds.length > 0) {
      await sendBulkNotifications(
        notificationRecipientIds,
        "fee",
        "New Fee Voucher Generated",
        `A new fee voucher "${title}" for PKR ${amount} has been issued. Due Date: ${new Date(dueDate).toLocaleDateString()}`,
        "/student/fees"
      );
    }

    logger.info(`Generated ${createdVouchers.length} fee vouchers for Campus (${campus.name})`);
    res.status(201).json({
      message: `Successfully generated ${createdVouchers.length} fee voucher(s).`,
      vouchersCount: createdVouchers.length,
      vouchers: createdVouchers,
    });
  } catch (error) {
    logger.error(`Error generating fee vouchers: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * 6. GET VOUCHERS LIST (Campus Admin & Student)
 */
export const getVouchers = async (req, res) => {
  try {
    const { role } = req.user;
    const { search, classId, status, feeType, sortBy, dateRange, balanceFilter, academicSession, page = 1, limit = 50 } = req.query;

    let queryFilter = {};

    if (role === "campus-admin") {
      const campus = await getAdminCampus(req.user._id);
      if (!campus) {
        return res.status(403).json({ message: "No active campus assigned to this admin." });
      }
      queryFilter.campus = campus._id;

      if (classId && classId !== "all") queryFilter.class = classId;
      if (feeType && feeType !== "all") queryFilter.feeType = feeType;
    } else if (role === "student") {
      queryFilter.student = req.user._id;
      if (feeType && feeType !== "all") queryFilter.feeType = feeType;
    } else {
      return res.status(403).json({ message: "Unauthorized role for fee vouchers." });
    }

    if (status && status !== "all") {
      queryFilter.status = status;
    }

    if (academicSession && academicSession !== "all") {
      queryFilter.academicSession = academicSession;
    }

    if (balanceFilter === "has_balance") {
      queryFilter.remainingBalance = { $gt: 0 };
    } else if (balanceFilter === "cleared") {
      queryFilter.remainingBalance = 0;
    }

    // Auto-update overdue vouchers before returning
    const currentDate = new Date();
    await FeeVoucher.updateMany(
      {
        ...queryFilter,
        status: { $in: ["pending", "partially_paid"] },
        dueDate: { $lt: currentDate },
      },
      { $set: { status: "overdue" } }
    );

    let voucherDocs = await FeeVoucher.find(queryFilter)
      .populate("student", "name email contact rollNumber")
      .populate("class", "className section gradeLevel grade")
      .populate("campus", "name code city")
      .sort({ createdAt: -1 })
      .lean();

    // Client-side search filtering (by student name, email, voucherNumber, title)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      voucherDocs = voucherDocs.filter((v) => {
        const studentName = v.student?.name?.toLowerCase() || "";
        const studentEmail = v.student?.email?.toLowerCase() || "";
        const voucherNo = v.voucherNumber?.toLowerCase() || "";
        const title = v.title?.toLowerCase() || "";
        return studentName.includes(q) || studentEmail.includes(q) || voucherNo.includes(q) || title.includes(q);
      });
    }

    // Date Range Filter
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      if (dateRange === "this_month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        voucherDocs = voucherDocs.filter((v) => {
          const d = new Date(v.dueDate);
          return d >= startOfMonth && d <= endOfMonth;
        });
      } else if (dateRange === "overdue") {
        voucherDocs = voucherDocs.filter((v) => new Date(v.dueDate) < now && v.remainingBalance > 0);
      }
    }

    // Sorting
    if (sortBy) {
      if (sortBy === "oldest") {
        voucherDocs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy === "dueDateAsc") {
        voucherDocs.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      } else if (sortBy === "dueDateDesc") {
        voucherDocs.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
      } else if (sortBy === "amountHigh") {
        voucherDocs.sort((a, b) => b.totalAmount - a.totalAmount);
      } else if (sortBy === "amountLow") {
        voucherDocs.sort((a, b) => a.totalAmount - b.totalAmount);
      } else if (sortBy === "balanceHigh") {
        voucherDocs.sort((a, b) => b.remainingBalance - a.remainingBalance);
      }
    }

    res.json({
      total: voucherDocs.length,
      vouchers: voucherDocs,
    });
  } catch (error) {
    logger.error(`Error fetching vouchers: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 7. GET VOUCHER BY ID (Campus Admin & Student)
 */
export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    const voucher = await FeeVoucher.findById(id)
      .populate("student", "name email contact rollNumber")
      .populate("class", "className section gradeLevel")
      .populate("campus", "name code address city contact")
      .populate("payments.recordedBy", "name email");

    if (!voucher) {
      return res.status(404).json({ message: "Fee voucher not found." });
    }

    if (role === "campus-admin") {
      const campus = await getAdminCampus(req.user._id);
      if (!campus || voucher.campus._id.toString() !== campus._id.toString()) {
        return res.status(403).json({ message: "Access denied. Voucher belongs to another campus." });
      }
    } else if (role === "student") {
      if (voucher.student._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied. You can only view your own fee vouchers." });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized role for fee vouchers." });
    }

    res.json(voucher);
  } catch (error) {
    logger.error(`Error fetching voucher details: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 8. RECORD PAYMENT (Campus Admin Only)
 */
export const recordPayment = async (req, res) => {
  try {
    const campus = await getAdminCampus(req.user._id);
    if (!campus) {
      return res.status(403).json({ message: "No active campus assigned to this admin." });
    }

    const { id } = req.params;
    const { amount, paymentDate, paymentMethod, transactionId, notes } = req.body;

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Payment amount must be a positive number." });
    }

    const voucher = await FeeVoucher.findOne({ _id: id, campus: campus._id });
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found or access denied." });
    }

    if (voucher.remainingBalance <= 0 || voucher.status === "paid") {
      return res.status(400).json({ message: "Voucher is already fully paid." });
    }

    if (numericAmount > voucher.remainingBalance) {
      return res.status(400).json({
        message: `Payment amount (PKR ${numericAmount}) cannot exceed remaining balance (PKR ${voucher.remainingBalance}).`,
      });
    }

    // Process Payment
    voucher.paidAmount += numericAmount;
    voucher.remainingBalance = voucher.totalAmount - voucher.paidAmount;

    if (voucher.remainingBalance <= 0) {
      voucher.remainingBalance = 0;
      voucher.status = "paid";
    } else {
      voucher.status = "partially_paid";
    }

    voucher.payments.push({
      amount: numericAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || "cash",
      transactionId: transactionId || "",
      recordedBy: req.user._id,
      notes: notes || "",
    });

    await voucher.save();

    // Trigger real-time notification to the student
    await sendNotification(
      voucher.student,
      "fee",
      "Fee Payment Received",
      `Payment of PKR ${numericAmount} recorded for "${voucher.title}". Remaining balance: PKR ${voucher.remainingBalance}`,
      "/student/fees"
    );

    logger.info(`Payment of ${numericAmount} recorded for Voucher ${voucher.voucherNumber}`);
    res.json({
      message: "Payment recorded successfully.",
      voucher,
    });
  } catch (error) {
    logger.error(`Error recording payment: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * 9. DOWNLOAD VOUCHER PDF (Campus Admin & Student)
 */
export const downloadVoucherPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    const voucher = await FeeVoucher.findById(id)
      .populate("student", "name email contact rollNumber")
      .populate("class", "className section gradeLevel")
      .populate("campus", "name code address city contact");

    if (!voucher) {
      return res.status(404).json({ message: "Fee voucher not found." });
    }

    if (role === "campus-admin") {
      const campus = await getAdminCampus(req.user._id);
      if (!campus || voucher.campus._id.toString() !== campus._id.toString()) {
        return res.status(403).json({ message: "Access denied. Voucher belongs to another campus." });
      }
    } else if (role === "student") {
      if (voucher.student._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied. You can only download your own fee vouchers." });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized role." });
    }

    // Get enrollment for student roll number if available
    const enrollment = await StudentEnrollment.findOne({
      student: voucher.student._id,
      campus: voucher.campus._id,
    });

    const studentInfo = {
      name: voucher.student?.name,
      rollNumber: enrollment?.rollNumber || "N/A",
      className: voucher.class?.className || "N/A",
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Voucher_${voucher.voucherNumber}.pdf"`
    );

    const pdfDocStream = generateFeeVoucherPDF(voucher, voucher.campus, studentInfo);
    pdfDocStream.pipe(res);
  } catch (error) {
    logger.error(`Error generating fee PDF: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 10. GET FEE SUMMARY METRICS (Campus Admin Only)
 */
export const getFeeSummary = async (req, res) => {
  try {
    const campus = await getAdminCampus(req.user._id);
    if (!campus) {
      return res.status(403).json({ message: "No active campus assigned to this admin." });
    }

    const { academicSession } = req.query;

    // Auto-update overdue status before computing summary
    const currentDate = new Date();
    const overdueFilter = {
      campus: campus._id,
      status: { $in: ["pending", "partially_paid"] },
      dueDate: { $lt: currentDate },
    };
    if (academicSession && academicSession !== "all") {
      overdueFilter.academicSession = academicSession;
    }
    await FeeVoucher.updateMany(overdueFilter, { $set: { status: "overdue" } });

    const voucherFilter = { campus: campus._id };
    if (academicSession && academicSession !== "all") {
      voucherFilter.academicSession = academicSession;
    }
    const vouchers = await FeeVoucher.find(voucherFilter);

    let totalExpected = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    let pendingCount = 0;
    let partiallyPaidCount = 0;
    let paidCount = 0;
    let overdueCount = 0;

    vouchers.forEach((v) => {
      totalExpected += v.totalAmount || 0;
      totalCollected += v.paidAmount || 0;
      totalOutstanding += v.remainingBalance || 0;

      if (v.status === "paid") {
        paidCount++;
      } else if (v.status === "partially_paid") {
        partiallyPaidCount++;
      } else if (v.status === "overdue") {
        overdueCount++;
        totalOverdue += v.remainingBalance || 0;
      } else {
        pendingCount++;
      }
    });

    res.json({
      totalVouchers: vouchers.length,
      totalExpected,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      counts: {
        pending: pendingCount,
        partially_paid: partiallyPaidCount,
        paid: paidCount,
        overdue: overdueCount,
      },
    });
  } catch (error) {
    logger.error(`Error fetching fee summary: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
