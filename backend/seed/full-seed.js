import mongoose from "mongoose";
import User from "../models/User.js";
import Campus from "../models/Campus.js";
import ClassModel from "../models/Class.js";
import Subject from "../models/Subject.js";
import Assignment from "../models/Assignment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import Exam from "../models/Exam.js";
import Score, { generateMarksheet } from "../models/Score.js";
import TeacherAttendance from "../models/TeacherAttendance.js";
import StudentAttendance from "../models/StudentAttendance.js";

const MONGODB_URI = process.env.MONGO_URI;

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log("Connected to MongoDB ->", MONGODB_URI);

    // Clear old data from main collections used by app
    await Promise.all([
      User.deleteMany(),
      Campus.deleteMany(),
      ClassModel.deleteMany(),
      Subject.deleteMany(),
      Assignment.deleteMany(),
      TeacherAssignment.deleteMany(),
      StudentEnrollment.deleteMany(),
      Exam.deleteMany(),
      Score.deleteMany(),
      TeacherAttendance.deleteMany(),
      StudentAttendance.deleteMany(),
    ]);

    // 1) Super Admin
    const superAdmin = await User.create({
      name: "Super Admin",
      gender: "Male",
      email: "superadmin@example.com",
      password: "superpassword",
      contact: "03000000001",
      address: "Head Office",
      dob: new Date("1980-01-01"),
      role: "super-admin",
    });

    // Additional Super Admin (Saad)
    const superAdminSaad = await User.create({
      name: "Saad Bin Khalid",
      gender: "Male",
      email: "saadbinkhalid1895@gmail.com",
      password: "123456",
      contact: "03000000002",
      address: "Head Office",
      dob: new Date("1985-01-01"),
      role: "super-admin",
    });

    // 2) Create Campus Admins and Campuses
    const campusAdminData = [
      {
        name: "North Admin",
        email: "north.admin@school.com",
        contact: "03010000001",
        city: "Islamabad",
      },
      {
        name: "South Admin",
        email: "south.admin@school.com",
        contact: "03010000002",
        city: "Karachi",
      },
    ];

    const campusAdmins = [];
    for (const admin of campusAdminData) {
      const u = await User.create({
        name: admin.name,
        gender: "Female",
        email: admin.email,
        password: "admin123",
        contact: admin.contact,
        address: admin.city,
        dob: new Date("1990-05-05"),
        role: "campus-admin",
        createdBy: superAdmin._id,
      });
      campusAdmins.push(u);
    }

    const campusSpecs = [
      {
        name: "North Campus",
        code: "NORTH-001",
        city: "Islamabad",
        admin: campusAdmins[0],
      },
      {
        name: "South Campus",
        code: "SOUTH-001",
        city: "Karachi",
        admin: campusAdmins[1],
      },
    ];

    const campuses = [];
    for (const cs of campusSpecs) {
      const c = await Campus.create({
        name: cs.name,
        code: cs.code,
        address: `${cs.city} Main Road`,
        city: cs.city,
        location: {
          type: "Point",
          coordinates: [randomInt(60, 80), randomInt(20, 35)],
        },
        contact: {
          phone: "021-111-000000",
          email: `${cs.name.replace(/\s+/g, "").toLowerCase()}@school.com`,
        },
        campusAdmin: cs.admin._id,
      });
      cs.admin.campus = c._id;
      await cs.admin.save();
      campuses.push(c);
    }

    // 3) Subjects (global)
    const subjectList = [
      { name: "Mathematics", code: "MATH" },
      { name: "English", code: "ENG" },
      { name: "Science", code: "SCI" },
      { name: "History", code: "HIS" },
      { name: "Islamiyat", code: "ISL" },
      { name: "Computer", code: "COMP" },
    ];

    const subjects = [];
    for (const s of subjectList) {
      const doc = await Subject.create({ ...s, createdBy: superAdmin._id });
      subjects.push(doc);
    }

    // 4) Teachers per campus
    const teachers = {};
    for (const campus of campuses) {
      teachers[campus.code] = [];
      const cspec = campusSpecs.find((c) => c.code === campus.code);

      for (let i = 1; i <= 6; i++) {
        const t = await User.create({
          name: `${campus.name.split(" ")[0]} Teacher ${i}`,
          gender: i % 2 === 0 ? "Male" : "Female",
          email: `${campus.code.toLowerCase()}_teacher${i}@school.com`,
          password: "teacher123",
          contact: `03020000${100 + i}`,
          address: campus.city,
          dob: new Date(`199${i}-01-01`),
          role: "teacher",
          // ❌ REMOVED: campus: campus._id,
          createdBy: cspec.admin._id,
        });
        teachers[campus.code].push(t);
      }
    }

    // 5) Create classes (grades 6-8, sections A,B) per campus and assign unique class teachers
    const classes = [];
    for (const campus of campuses) {
      // make a shallow copy of teachers array and shuffle it so we can assign unique teachers per class
      const campusTeachers = [...teachers[campus.code]];
      // simple Fisher-Yates shuffle
      for (let i = campusTeachers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [campusTeachers[i], campusTeachers[j]] = [
          campusTeachers[j],
          campusTeachers[i],
        ];
      }

      const grades = [6, 7, 8];
      const sections = ["A", "B"];
      let teacherIndex = 0;
      for (const grade of grades) {
        for (const section of sections) {
          // assign each teacher only once as class teacher
          if (teacherIndex >= campusTeachers.length) {
            throw new Error(
              `Not enough teachers to assign unique class teachers for campus ${campus.name}`
            );
          }
          const classTeacher = campusTeachers[teacherIndex];
          teacherIndex++;
          const classDoc = await ClassModel.create({
            grade,
            section,
            campus: campus._id,
            classTeacher: classTeacher._id,
            createdBy: campus.campusAdmin,
          });
          classes.push(classDoc);
        }
      }
    }

    // 6) Attach subjects + Assignments
    const allAssignments = [];
    for (const cls of classes) {
      const chosen = [];
      while (chosen.length < 4) {
        const s = subjects[randomInt(0, subjects.length - 1)];
        if (!chosen.find((x) => x._id.equals(s._id))) chosen.push(s);
      }
      cls.subjects = chosen.map((s) => s._id);
      await cls.save();

      for (const subj of chosen) {
        const asg = await Assignment.create({
          campus: cls.campus,
          class: cls._id,
          subject: subj._id,
        });
        allAssignments.push(asg);
      }
    }

    // 7) TeacherAssignments
    const teacherAssignments = [];
    for (const campus of campuses) {
      const campusAssigns = allAssignments.filter((a) =>
        a.campus.equals(campus._id)
      );
      const campusTeachers = teachers[campus.code];
      for (const teacher of campusTeachers) {
        const picks = [];
        const pickCount = randomInt(2, Math.min(4, campusAssigns.length));
        while (picks.length < pickCount) {
          const cand = campusAssigns[randomInt(0, campusAssigns.length - 1)];
          if (!picks.find((p) => p._id.equals(cand._id))) picks.push(cand);
        }
        const ta = await TeacherAssignment.create({
          teacher: teacher._id,
          assignments: picks.map((p) => p._id),
        });
        teacherAssignments.push(ta);
      }
    }

    // 8) Students + Enrollments
    const students = [];
    const enrollments = [];
    for (const cls of classes) {
      for (let i = 1; i <= 8; i++) {
        const stu = await User.create({
          name: `Student ${cls.grade}${cls.section}-${i}`,
          gender: i % 2 === 0 ? "Female" : "Male",
          email: `student_${cls._id.toString().slice(-4)}_${i}@school.com`,
          password: "student123",
          contact: `03030000${i}`,
          address: "Student Address",
          dob: new Date(2008, randomInt(0, 11), randomInt(1, 28)),
          role: "student",
          // ❌ REMOVED: campus: cls.campus,
          createdBy: cls.createdBy,
        });
        const rollNumber = `${cls.grade}${cls.section}${String(i).padStart(
          2,
          "0"
        )}`;
        const enrollment = await StudentEnrollment.create({
          student: stu._id,
          campus: cls.campus,
          class: cls._id,
          rollNumber,
          academicSession: "2025-2026",
        });
        students.push({ user: stu, class: cls });
        enrollments.push(enrollment);
      }
    }

    await pause(200);

    // ✅ Additional Test Students (Saad & Sheryaar)
    const testStudent1 = await User.create({
      name: "Saad (Test Student)",
      gender: "Male",
      email: "sbk1895@gmail.com",
      password: "123456",
      contact: "03030001001",
      address: "Test Address",
      dob: new Date(2008, 5, 15),
      role: "student",
      createdBy: superAdmin._id,
    });

    const testStudent2 = await User.create({
      name: "Sheryaar (Test Student)",
      gender: "Male",
      email: "sheryaarlong@gmail.com",
      password: "123456",
      contact: "03030001002",
      address: "Test Address",
      dob: new Date(2008, 8, 20),
      role: "student",
      createdBy: superAdmin._id,
    });

    // Enroll test students in a class
    const testClass = classes[0]; // Enroll in first class

    const testEnrollment1 = await StudentEnrollment.create({
      student: testStudent1._id,
      campus: testClass.campus,
      class: testClass._id,
      rollNumber: "TEST01",
      academicSession: "2025-2026",
    });

    const testEnrollment2 = await StudentEnrollment.create({
      student: testStudent2._id,
      campus: testClass.campus,
      class: testClass._id,
      rollNumber: "TEST02",
      academicSession: "2025-2026",
    });

    students.push({ user: testStudent1, class: testClass });
    students.push({ user: testStudent2, class: testClass });
    enrollments.push(testEnrollment1);
    enrollments.push(testEnrollment2);

    // 9) Exams with different types and marks
    const exams = [];
    const examTypes = [
      { type: "Examination", totalMarks: 100 },
      { type: "Assessment 1", totalMarks: 20 },
      { type: "Assessment 2", totalMarks: 20 },
      { type: "Classwork", totalMarks: 5 },
      { type: "Homework", totalMarks: 5 },
    ];
    for (const cls of classes) {
      const clsSubjects = await Subject.find({ _id: { $in: cls.subjects } });
      for (const subj of clsSubjects) {
        for (const examType of examTypes) {
          const ex = await Exam.create({
            term: "FirstTerm",
            academicSession: "2025-2026",
            class: cls._id,
            subject: subj._id,
            campus: cls.campus,
            totalMarks: examType.totalMarks,
            type: examType.type,
          });
          exams.push(ex);
        }
      }
    }

    // 10) Scores - BATCH INSERT (OPTIMIZED)
    console.log("⏳ Preparing scores...");
    const scoresToInsert = [];
    for (const exam of exams) {
      const enrolled = students.filter((s) => s.class._id.equals(exam.class));
      for (const s of enrolled) {
        // Scale marks based on exam type totalMarks (35% minimum to max)
        const minMarks = Math.max(1, Math.floor(exam.totalMarks * 0.35));
        const obtained = randomInt(minMarks, exam.totalMarks);
        scoresToInsert.push({
          student: s.user._id,
          class: exam.class,
          subject: exam.subject,
          campus: exam.campus,
          exam: exam._id,
          marksObtained: obtained,
          enteredBy: superAdmin._id,
        });
      }
    }

    // Batch insert all scores at once (much faster)
    console.log(`⏳ Inserting ${scoresToInsert.length} scores...`);
    await Score.insertMany(scoresToInsert, { ordered: false });
    console.log(`✅ ${scoresToInsert.length} scores inserted`);

    // 11) Teacher Attendance - FIXED: Using campus loop
    console.log("⏳ Creating teacher attendance...");
    let teacherAttendanceCount = 0;

    for (const campus of campuses) {
      const campusTeachers = teachers[campus.code];

      if (!campusTeachers || campusTeachers.length === 0) {
        console.warn(`⚠️ No teachers found for campus ${campus.name}`);
        continue;
      }

      for (const teacher of campusTeachers) {
        // Generate attendance for the last 30 days
        for (let d = 0; d < 30; d++) {
          const date = new Date();
          date.setDate(date.getDate() - d);

          await TeacherAttendance.create({
            teacher: teacher._id,
            status: ["present", "absent", "leave"][randomInt(0, 2)],
            campus: campus._id,
            checkIn: new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
              8,
              randomInt(0, 59)
            ),
            checkOut: new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
              14,
              randomInt(0, 59)
            ),
            date,
            markedBy: campus.campusAdmin,
          });
          teacherAttendanceCount++;
        }
      }

      console.log(
        `✅ Created attendance for ${campusTeachers.length} teachers in ${campus.name}`
      );
    }

    console.log(
      `✅ Total teacher attendance records: ${teacherAttendanceCount}`
    );

    // 12) Student Attendance
    console.log("⏳ Creating student attendance...");
    let studentAttendanceCount = 0;

    for (const enrollment of enrollments) {
      for (let d = 0; d < 60; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        await StudentAttendance.create({
          enrollment: enrollment._id,
          status: ["present", "absent", "leave"][randomInt(0, 2)],
          class: enrollment.class,
          campus: enrollment.campus,
          term: "FirstTerm",
          academicSession: "2025-2026",
          date,
          markedBy: superAdmin._id,
        });
        studentAttendanceCount++;
      }
    }
    console.log(
      `✅ Total student attendance records: ${studentAttendanceCount}`
    );

    // 13) Generate marksheets (OPTIMIZED)
    console.log("⏳ Generating marksheets...");
    const allScores = await Score.find()
      .populate("exam", "term academicSession totalMarks")
      .populate("subject", "name")
      .populate("student", "name");

    // Group by unique student-class-term combinations
    const uniqueCombinations = new Map();
    for (const score of allScores) {
      if (!score.exam) continue;
      const key = `${score.student._id}-${score.class}-${score.exam.term}-${score.exam.academicSession}`;
      uniqueCombinations.set(key, score);
    }

    console.log(
      `📊 Found ${uniqueCombinations.size} unique marksheets to generate`
    );

    // Generate marksheets in batches (skip AI for speed)
    const batchSize = 20;
    const uniqueScores = Array.from(uniqueCombinations.values());

    for (let i = 0; i < uniqueScores.length; i += batchSize) {
      const batch = uniqueScores.slice(i, i + batchSize);
      await Promise.all(batch.map((score) => generateMarksheet(score, true))); // true = skip AI
      console.log(
        `✅ Generated ${Math.min(i + batchSize, uniqueScores.length)}/${
          uniqueScores.length
        } marksheets`
      );
    }

    const allTeachers = Object.values(teachers).flat();

    // 13) Create Parent accounts linked to students
    const parentAccounts = [];
    // Pick 2 students from first campus as children for parent 1
    const firstCampusStudents = students.filter(s => s.class.campus?.equals(campuses[0]._id));
    const parent1Children = firstCampusStudents.slice(0, 2).map(s => s.user._id);
    const parent1 = await User.create({
      name: "Ahmed Khan (Parent)",
      gender: "Male",
      email: "parent1@school.com",
      password: "parent123",
      contact: "03040000001",
      address: "Islamabad",
      dob: new Date("1975-03-15"),
      role: "parent",
      parentOf: parent1Children,
      createdBy: superAdmin._id,
    });
    parentAccounts.push(parent1);

    // Pick 2 students from second campus as children for parent 2
    const secondCampusStudents = students.filter(s => s.class.campus?.equals(campuses[1]._id));
    const parent2Children = secondCampusStudents.slice(0, 2).map(s => s.user._id);
    const parent2 = await User.create({
      name: "Fatima Ali (Parent)",
      gender: "Female",
      email: "parent2@school.com",
      password: "parent123",
      contact: "03040000002",
      address: "Karachi",
      dob: new Date("1978-07-20"),
      role: "parent",
      parentOf: parent2Children,
      createdBy: superAdmin._id,
    });
    parentAccounts.push(parent2);

    console.log("\n✅ Seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  • Campuses: ${campuses.length}`);
    console.log(`  • Teachers: ${allTeachers.length}`);
    console.log(`  • Students: ${students.length}`);
    console.log(`  • Classes: ${classes.length}`);
    console.log(`  • Subjects: ${subjects.length}`);
    console.log(`  • Exams: ${exams.length}`);
    console.log(`  • Scores: ${scoresToInsert.length}`);
    console.log(`  • Teacher Attendance: ${teacherAttendanceCount}`);
    console.log(`  • Student Attendance: ${studentAttendanceCount}`);
    console.log(`  • Marksheets: ${uniqueCombinations.size}`);
    console.log(`  • Parent Accounts: ${parentAccounts.length}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

seed();
