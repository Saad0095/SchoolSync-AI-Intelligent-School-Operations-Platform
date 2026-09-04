import Score from "../models/Score.js";
import User from "../models/User.js"; 
import Notification from "../models/Notification.js";
import Campus from "../models/Campus.js";
import { generateStudyRecommendation, generateTeacherContent, generateCommunicationVariants } from "../services/groqService.js";
import { sendBulkNotifications } from "../services/notificationService.js";

export const getStudyRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId)
      return res.status(400).json({ message: "Student ID is required" });

    // Validate ownership/authorization
    if (req.user.role === "student" && req.user._id.toString() !== studentId.toString()) {
      return res.status(403).json({ message: "Unauthorized access to other student data" });
    }

    const student = await User.findById(studentId).select("name role");
    if (!student || student.role !== "student")
      return res.status(404).json({ message: "Student not found" });

    const scores = await Score.find({ student: studentId }).populate("subject exam");
    if (!scores.length)
      return res.status(404).json({ message: "No scores found for this student" });

    const studentData = {
      name: student.name,
      scores: scores.map(s => ({
        subject: s.subject?.name || "Unknown",
        marksObtained: s.marksObtained,
        maxMarks: s.exam?.totalMarks || 100,
      }))
    };

    const recommendation = await generateStudyRecommendation(studentData);

    res.json({
      studentId,
      studentName: student.name, 
      totalSubjects: scores.length,
      recommendation,
    });
  } catch (error) {
    console.error("Error in getStudyRecommendations:", error);
    res.status(500).json({
      message: "Error generating study recommendations",
      error: error.message,
    });
  }
};

export const generateTeacherAssistantContent = async (req, res) => {
  try {
    const { type, subject, grade, topic, language, bloomLevel, count } = req.body;
    
    if (!type || !topic) {
      return res.status(400).json({ message: "Type and topic are required" });
    }

    const content = await generateTeacherContent(type, subject, grade, topic, language, bloomLevel, count);

    res.json({ success: true, data: content });
  } catch (error) {
    console.error("Error in AI Teacher Assistant:", error);
    res.status(500).json({ message: "Failed to generate content", error: error.message });
  }
};

export const generateCommunication = async (req, res) => {
  try {
    const { prompt, language = "en", channels = ["circular"] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const variants = await generateCommunicationVariants(prompt, language, channels);

    res.json({ success: true, variants });
  } catch (error) {
    console.error("Error generating communication:", error);
    res.status(500).json({ message: "Failed to generate communication", error: error.message });
  }
};

export const dispatchCommunication = async (req, res) => {
  try {
    const { message, title = "Announcement", type = "announcement", targetRoles = [] } = req.body;
    const { role, _id: userId } = req.user;

    if (!message) {
      return res.status(400).json({ message: "Message content is required" });
    }

    let userFilter = {};

    if (role === "campus-admin") {
      // Campus admins can only notify users they created
      userFilter.createdBy = userId;
    } else if (role !== "super-admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Apply target roles filter if provided
    if (targetRoles.length > 0) {
      userFilter.role = { $in: targetRoles };
    }

    const targetUsers = await User.find(userFilter).select("_id");
    const recipientIds = targetUsers.map(u => u._id);

    if (recipientIds.length > 0) {
      await sendBulkNotifications(recipientIds, type, title, message);
    }

    res.json({ success: true, message: `Dispatched to ${recipientIds.length} users.` });
  } catch (error) {
    console.error("Error dispatching communication:", error);
    res.status(500).json({ message: "Failed to dispatch communication", error: error.message });
  }
};
