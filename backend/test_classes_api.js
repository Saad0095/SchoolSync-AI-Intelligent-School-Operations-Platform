import mongoose from "mongoose";
import "dotenv/config";
import User from "./models/User.js";
import Campus from "./models/Campus.js";
import Class from "./models/Class.js";
import StudentEnrollment from "./models/StudentEnrollment.js";

async function testClassesApi() {
  console.log("=== DIAGNOSING CLASSES & ENROLLMENTS API FOR CAMPUS ADMIN ===");

  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/school-management-system";
    await mongoose.connect(mongoURI, { family: 4 });
    console.log("1. MongoDB Connected");

    const campusAdmin = await User.findOne({ email: "north.admin@school.com" });
    if (!campusAdmin) throw new Error("Campus admin north.admin@school.com not found!");
    console.log("2. Found Admin:", campusAdmin.email, "ID:", campusAdmin._id);

    const campus = await Campus.findOne({ campusAdmin: campusAdmin._id, isActive: true });
    if (!campus) throw new Error("Campus not found for north.admin@school.com!");
    console.log("3. Found Campus:", campus.name, "ID:", campus._id);

    // Query classes for this campus
    const classes = await Class.find({ campus: campus._id, isActive: true });
    console.log("4. Classes in DB for this campus count:", classes.length);
    console.log("   Classes raw:", classes);

    // Query enrollments for this campus
    const enrollments = await StudentEnrollment.find({ campus: campus._id, isActive: true })
      .populate("student", "name email");
    console.log("5. Enrollments in DB for this campus count:", enrollments.length);
    console.log("   Enrollments raw:", enrollments);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("=== DIAGNOSTIC ERROR ===", err);
    process.exit(1);
  }
}

testClassesApi();
