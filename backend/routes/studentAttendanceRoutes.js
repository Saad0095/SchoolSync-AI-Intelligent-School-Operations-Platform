import express from "express";

import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import {
  deleteStudentAttendance,
  getAllStudentsAttendance,
  getStudentAttendance,
  markBulkStudentAttendance,
  updateStudentAttendance,
} from "../controllers/studentAttendanceController.js";
import { schemaValidation } from "../middlewares/validate.js";
import { studentAssignmentSchema } from "../validators/studentAttendanceValidator.js";

const router = express.Router();

router.post(
  "/markAttendance",
  schemaValidation(studentAssignmentSchema),
  authenticate,
  authRole(["teacher", "campus-admin", "super-admin"]),
  markBulkStudentAttendance
);
router.get(
  "/",
  authenticate,
  authRole(["teacher", "campus-admin", "super-admin"]),
  getAllStudentsAttendance
);
router.get(
  "/:studentId",
  authenticate,
  authRole(["campus-admin", "super-admin", "student"]),
  getStudentAttendance
);
router.put(
  "/student/:id",
  authenticate,
  authRole(["campus-admin", "super-admin"]),
  updateStudentAttendance
);
router.delete(
  "/student/:id",
  authenticate,
  authRole(["campus-admin", "super-admin"]),
  deleteStudentAttendance
);

export default router;
