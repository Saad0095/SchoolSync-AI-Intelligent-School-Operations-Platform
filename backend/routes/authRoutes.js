import express from "express";
import {
  login,
  register,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  registerCampusAdmin,
  addTeacherStudent,
  getUserById,
  forgetPassword,
  resetPassword,
  updateProfile,
  updatePassword,
  adminResetPassword
} from "../controllers/authController.js";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { schemaValidation } from '../middlewares/validate.js'
import { registerSchema } from '../validators/authValidator.js'
const router = express.Router();

router.post("/createSuperAdmin", schemaValidation(registerSchema), register);    
router.post("/register-admin", schemaValidation(registerSchema), authenticate, authRole(["super-admin"]), registerCampusAdmin);
router.post("/add-user", schemaValidation(registerSchema), authenticate, authRole(["campus-admin", 'super-admin']), addTeacherStudent);
router.post("/login", login);
router.get("/me", authenticate, getMe);

// Update Profile
router.put("/update-profile", authenticate, updateProfile);
router.put("/update-password", authenticate, updatePassword);

// Password Management
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/users", authenticate, authRole(["super-admin", "campus-admin"]), getAllUsers);
router.get("/users/:id", authenticate, authRole(["super-admin", "campus-admin"]), getUserById);
router.put("/users/:id", authenticate, authRole(["super-admin", "campus-admin"]), updateUser);
router.delete("/users/:id", authenticate, authRole(["super-admin","campus-admin"]), deleteUser);

// Admin-initiated password reset
router.put("/admin-reset-password/:id", authenticate, authRole(["super-admin", "campus-admin"]), adminResetPassword);

export default router;
