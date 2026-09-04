import express from "express";
import {
  createSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
  getSubjectById,
} from "../controllers/subjectController.js";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { schemaValidation } from "../middlewares/validate.js";
import { subjectValidationSchema } from "../validators/subjectValidator.js";

const router = express.Router();

router.post(
  "/",
  schemaValidation(subjectValidationSchema),
  authenticate,
  authRole(["super-admin"]),
  createSubject
);

router.get(
  "/",
  authenticate,
  authRole(["campus-admin", "super-admin", "teacher"]),
  getAllSubjects
);

router.get("/:id", authenticate, authRole(["campus-admin", "super-admin", "teacher"]), getSubjectById);
router.put("/:id", authenticate, authRole(["super-admin"]), updateSubject);
router.delete("/:id", authenticate, authRole(["super-admin"]), deleteSubject);

export default router;
