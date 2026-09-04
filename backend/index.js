import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import "dotenv/config";
import "./cronJobs/cronJobs.js";
import connectDB from "./db/index.js";
import authRoutes from "./routes/authRoutes.js"
import classRoutes from './routes/classRoutes.js'
import campusRoutes from './routes/campusRoutes.js'
import subjectRoutes from './routes/subjectRoutes.js'
import studentAttendanceRoutes from './routes/studentAttendanceRoutes.js'
import teacherAttendanceRoutes from './routes/teacherAttendanceRoutes.js'
import enrollmentRoutes from './routes/enrollmentRoutes.js'
import examRoutes from './routes/examRoutes.js'
import scoreRoutes from './routes/scoreRoutes.js'
import marksheetRoutes from './routes/marksheetRoute.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import feeRoutes from './routes/feeRoutes.js'
import morgan from "morgan";
import cors from "cors";
import logger from "./utils/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const httpServer = createServer(app);

connectDB();


const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173", 
  "http://localhost:5174", 
  "http://localhost:5175", 
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) return true;
  if (origin.endsWith(".vercel.app")) return true;
  return false;
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Initialize Socket.io
export const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

// Socket.io Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { userId, role }
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.io Connection Logic
io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id} (User: ${socket.user.userId})`);
  
  // Join the user to their own private room
  const userRoom = `user:${socket.user.userId}`;
  socket.join(userRoom);
  
  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

app.use(
  morgan("tiny", {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is healthy 🚀",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// API Routes
app.use("/api/auth", authRoutes)
app.use('/api/campuses', campusRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/subjects', subjectRoutes)
app.use("/api/attendance/students", studentAttendanceRoutes);
app.use("/api/attendance/teachers", teacherAttendanceRoutes);
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/score', scoreRoutes)
app.use('/api/result', marksheetRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/fees', feeRoutes)

app.use(errorHandler)

const port = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  httpServer.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
  });
}

export default app;