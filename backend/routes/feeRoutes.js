import express from "express";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { schemaValidation } from "../middlewares/validate.js";
import {
  feeStructureValidator,
  generateVouchersValidator,
  recordPaymentValidator,
} from "../validators/feeValidator.js";
import {
  createFeeStructure,
  getFeeStructures,
  updateFeeStructure,
  deleteFeeStructure,
  generateVouchers,
  getVouchers,
  getVoucherById,
  recordPayment,
  downloadVoucherPdf,
  getFeeSummary,
} from "../controllers/feeController.js";

const router = express.Router();

// Campus Admin Fee Structure Management Routes
router.post(
  "/structures",
  authenticate,
  authRole(["campus-admin"]),
  schemaValidation(feeStructureValidator),
  createFeeStructure
);
router.get(
  "/structures",
  authenticate,
  authRole(["campus-admin"]),
  getFeeStructures
);
router.put(
  "/structures/:id",
  authenticate,
  authRole(["campus-admin"]),
  updateFeeStructure
);
router.delete(
  "/structures/:id",
  authenticate,
  authRole(["campus-admin"]),
  deleteFeeStructure
);

// Voucher Generation (Campus Admin)
router.post(
  "/vouchers/generate",
  authenticate,
  authRole(["campus-admin"]),
  schemaValidation(generateVouchersValidator),
  generateVouchers
);

// Summary Metrics (Campus Admin)
router.get(
  "/summary",
  authenticate,
  authRole(["campus-admin"]),
  getFeeSummary
);

// Vouchers List & Details (Campus Admin & Student)
router.get(
  "/vouchers",
  authenticate,
  authRole(["campus-admin", "student"]),
  getVouchers
);
router.get(
  "/vouchers/:id",
  authenticate,
  authRole(["campus-admin", "student"]),
  getVoucherById
);
router.get(
  "/vouchers/:id/pdf",
  authenticate,
  authRole(["campus-admin", "student"]),
  downloadVoucherPdf
);

// Payment Recording (Campus Admin Only)
router.post(
  "/vouchers/:id/pay",
  authenticate,
  authRole(["campus-admin"]),
  schemaValidation(recordPaymentValidator),
  recordPayment
);

export default router;
