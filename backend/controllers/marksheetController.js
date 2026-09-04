import Marksheet from "../models/Marksheet.js"
import Class from "../models/Class.js"
import Campus from "../models/Campus.js"
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import logger from "../utils/logger.js";

export const getStudentMarksheet = async (req, res) => {
    try {
        const { studentId, classId, campusId, term, academicSession, page = 1, limit = 10, downloadZIP = 'false' } = req.query
        const { role, _id: userId } = req.user

        let filter = {}

        if (role === 'student') {
            filter.student = userId
        }
        else if (role === 'teacher') {
            const classTeacher = await Class.findOne({ classTeacher: userId, isActive: true })
            if (!classTeacher) {
                return res.status(403).json({ message: "You are not assigned as class teacher to any class" })
            }
            if (classId && classId !== classTeacher._id.toString()) {
                return res.status(403).json({ message: "You can only access marksheets of your class" })
            }
            filter.class = classTeacher._id
            if (studentId) {
                filter.student = studentId
            }
        } else if (role === 'campus-admin') {
            const campus = await Campus.findOne({ campusAdmin: userId, isActive: true })
            if (!campus) {
                return res.status(403).json({ message: "You are not assigned as campus admin to any campus" })
            }
            if (campusId && campusId !== campus._id.toString()) {
                return res.status(403).json({ message: "You can only access marksheets of your campus" })
            }
            const classes = await Class.find({ campus: campus._id, isActive: true }, '_id')
            const classIds = classes.map(c => c._id)
            filter.class = { $in: classIds }
            if (classId) {
                filter.class = classId
            } if (studentId) {
                filter.student = studentId
            }
        } else if (role === 'super-admin') {
            if (campusId) {
                const classes = await Class.find({ campus: campusId, isActive: true }, '_id')
                const classIds = classes.map(c => c._id)
                filter.class = { $in: classIds }
            }
            if (classId) {
                filter.class = classId
            }
            if (studentId) {
                filter.student = studentId
            }
        }
        if (term) {
            filter.term = term
        } if (academicSession) {
            filter.academicSession = academicSession
        }
        const skip = (page - 1) * limit
        const total = await Marksheet.countDocuments(filter)
        const marksheets = await Marksheet.find(filter)
            .populate('student', 'name email')
            .populate('class', 'grade section')
            .populate('subjects.subject', 'name')
            .sort({ overallPercentage: -1 })
            .skip(skip)
            .limit(parseInt(limit))

        // 🧾 If ZIP export is requested
        if (downloadZIP === "true") {
            const tempDir = path.join(process.cwd(), "temp-pdfs");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            // Generate one PDF per student
            for (const m of marksheets) {
                const pdfPath = path.join(tempDir, `${m.student.name.replace(/\s+/g, "_")}_marksheet.pdf`);
                const doc = new PDFDocument({ margin: 40, size: "A4" });
                const stream = fs.createWriteStream(pdfPath);
                doc.pipe(stream);

                // --- PDF Content ---
                doc.fontSize(18).text("Student Marksheet", { align: "center" });
                doc.moveDown();
                doc.fontSize(14).text(`Name: ${m.student.name}`);
                doc.text(`Email: ${m.student.email}`);
                doc.text(`Class: ${m.class.grade} - ${m.class.section}`);
                doc.text(`Term: ${m.term}`);
                doc.text(`Academic Session: ${m.academicSession}`);
                doc.moveDown();
                doc.text("Subjects:");
                m.subjects.forEach(sub => {
                    // doc.text(`${sub}`)
                    const subjectName = sub.subject?.name || "N/A";
                    doc.text(
                        `• ${subjectName}: ${sub.marksObtained}/${sub.totalMarks} (${sub.percentage}% - ${sub.grade})`
                    );
                });
                doc.moveDown()
                doc.text(`Overall Percentage: ${m.overallPercentage}%`, { underline: true });
                doc.moveDown();
                doc.end();

                await new Promise((resolve) => stream.on("finish", resolve));
            }

            // Create ZIP
            const zipPath = path.join(process.cwd(), "marksheets.zip");
            const output = fs.createWriteStream(zipPath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            archive.pipe(output);
            archive.directory(tempDir, false);
            await archive.finalize();

            output.on("close", () => {
                // Send ZIP file to client
                res.download(zipPath, "marksheets.zip", (err) => {
                    // Cleanup after download
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    fs.unlinkSync(zipPath);
                    if (err) logger.error("Error sending zip:", err);
                });
            });

            return;
        }

        res.json({
            totalMarksheets: total,
            page: parseInt(page),
            limit: parseInt(limit),
            marksheets

        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const updateMarksheetRemark = async (req, res) => {
    try {
        const { id } = req.params;
        const { finalRemarks } = req.body;
        
        // Basic authorization check
        const { role, _id: userId } = req.user;
        if (role === 'student') {
             return res.status(403).json({ message: "Students cannot edit remarks" });
        }

        const marksheet = await Marksheet.findById(id);
        if (!marksheet) {
             return res.status(404).json({ message: "Marksheet not found" });
        }

        // Apply new remark
        marksheet.finalRemarks = finalRemarks;
        // Optionally flag that a human has edited it
        marksheet.isAIGenerated = false; 
        
        await marksheet.save();

        res.json({ message: "Remark updated successfully", marksheet });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}