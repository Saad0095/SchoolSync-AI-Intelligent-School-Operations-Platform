import express from "express";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { getStudyRecommendations, generateTeacherAssistantContent, generateCommunication, dispatchCommunication } from "../controllers/aiController.js";

const router = express.Router();

router.get("/recommendation/:studentId", authenticate, authRole(["student", "campus-admin", "super-admin"]), getStudyRecommendations);

router.post("/teacher/generate", authenticate, authRole(["teacher"]), generateTeacherAssistantContent);

router.post("/communications/generate", authenticate, authRole(["super-admin", "campus-admin"]), generateCommunication);
router.post("/communications/dispatch", authenticate, authRole(["super-admin", "campus-admin"]), dispatchCommunication);

export default router;
