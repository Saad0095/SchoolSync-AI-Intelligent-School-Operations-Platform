import express from "express";

import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { deleteTeacherAttendance, getAllTeacherAttendance, getTeacherAttendance, markTeacherAttendance, teacherCheckOut, updateTeacherAttendance, markBulkTeacherAttendance } from "../controllers/teacherAttendanceController.js";
import { schemaValidation } from '../middlewares/validate.js'
import { teacherAttendanceValidator } from '../validators/teacherAttendanceValidator.js'

const router = express.Router();

router.post("/bulk", authenticate, authRole(["campus-admin", "super-admin"]), markBulkTeacherAttendance);
router.post("/markAttendance", schemaValidation(teacherAttendanceValidator), authenticate, authRole(["teacher","campus-admin", "super-admin"]), markTeacherAttendance);
router.put("/checkout", authenticate, authRole(["teacher", "campus-admin", "super-admin"]), teacherCheckOut);
router.get("/", authenticate, authRole(["campus-admin", "super-admin", "teacher"]), getAllTeacherAttendance);
router.get("/:teacherId", authenticate, authRole(["campus-admin", "super-admin", "teacher"]), getTeacherAttendance);
router.put("/teacher/:id", authenticate, authRole(["campus-admin", "super-admin"]), updateTeacherAttendance);
router.delete("/teacher/:id", authenticate, authRole(["campus-admin", "super-admin"]), deleteTeacherAttendance);


export default router;
