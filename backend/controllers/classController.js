import Campus from "../models/Campus.js";
import Class from "../models/Class.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import logger from "../utils/logger.js";


export const createClass = async (req, res) => {
  try {
    let { grade, section, subjects, classTeacher, campus } = req.body;

    if (req.user.role === "campus-admin") {
      const adminCampus = await Campus.findOne({ campusAdmin: req.user._id, isActive: true });
      if (!adminCampus) {
        return res.status(403).json({ message: "No campus assigned to this admin." });
      }
      campus = adminCampus._id;
    } else if (!campus) {
      return res.status(400).json({ message: "Campus is required for super-admin." });
    }

    const newClass = await Class.create({
      grade,
      section,
      campus,
      subjects,
      classTeacher,
      createdBy: req.user._id,
    });
    res.status(201).json({
      message: "Class created successfully",
      class: {
        id: newClass._id,
        grade: newClass.grade,
        section: newClass.section,
        subjects: newClass.subjects,
        classTeacher: newClass.classTeacher,
      },
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.classTeacher) {
      return res.status(400).json({ 
        message: "This teacher is already assigned as a class teacher for another class." 
      });
    }
    res
      .status(400)
      .json({ message: "Error creating class", error: err.message });
  }
};



// export const getAllClasses = async (req, res) => {
//   try {
//     const { role, _id } = req.user;
//     const { includeInactive, page = 1, limit = 5 } = req.query; // e.g. ?includeInactive=true

//     let filter = {};
//     let subjectMap = {}

//     if (role === "campus-admin") {
//       const campus = await Campus.findOne({ campusAdmin: _id });
//       if (!campus) {
//         return res.status(404).json({ error: "No campus assigned to this admin" });
//       }

//       filter.campus = campus._id;
//       filter.isActive = true; // campus-admins see only active
//     }

//     else if (role === "super-admin") {
//       if (!includeInactive) {
//         filter.isActive = true;
//       }
//     }
//     else if(role === 'teacher'){
//       const classTeacher = await Class.find({classTeacher: _id, isActive: true}).select('_id');
//       const subjectTeacher = await TeacherAssignment.find({teacher: _id})
//       .populate({
//         path: 'assignments',
//         match: { isActive: true },
//         populate: [{ path: 'class', select: '_id', match: { isActive: true } }, { path: 'subject', select: '_id' }]
//       })
//       subjectTeacher.forEach(assignment => {
//         assignment.assignments.forEach(a => {
//           if(a.class && a.subject){
//             const cId = a.class._id.toString()
//             if(!subjectMap[cId]){
//               subjectMap[cId] = []
//             }
//             subjectMap[cId].push(a.subject._id)
//           }
//         })
//       })
//       const subjectTeacherClassIds = Object.keys(subjectMap)
//       const classTeacherClassIds = classTeacher.map(c => c._id.toString())
//       const combinedClassIds = [...new Set([...subjectTeacherClassIds, ...classTeacherClassIds])]
//       if(!combinedClassIds.length){
//         return res.status(400).json({error: "No classes assigned to this teacher"})
//       }
//       filter._id = { $in: combinedClassIds }
//       filter.isActive = true 



//     }else {
//       return res.status(403).json({ error: "Access denied" });
//     }
//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     let classes = await Class.find(filter)
//       .populate("campus", "name code isActive")
//       .populate("classTeacher", "name email role")
//       .populate("subjects", "name code")
//       .skip(skip)
//       .sort({ createdAt: -1 })
//       .lean();
//     if (role === "teacher") {
//       classes = classes.map((cls) => {
//         const classId = cls._id.toString()
//         const isClassTeacher = cls.classTeacher?._id?.toString() === _id.toString()

//         if (!isClassTeacher && subjectMap[classId]) {
//           cls.subjects = cls.subjects.filter((subj) =>
//             subjectMap[classId].some((sid) => sid.toString() === subj._id.toString())
//           )
//         }

//         return cls;
//       });
//     }
//     res.json({
//       role,
//       count: classes.length,
//       page: parseInt(page),
//       limit: parseInt(limit),
//       data: classes,
//     });
//   } catch (error) {
//     logger.error(error);
//     res.status(400).json({ error: error.message });
//   }
// };
export const getAllClasses = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { includeInactive = "false", page = 1, limit = 5 } = req.query;

    let filter = {};

    /** ---------------- ROLE BASED FILTER ---------------- */

    if (role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: _id }).select("_id");

      if (!campus) {
        return res.status(404).json({ error: "No campus assigned to this admin" });
      }

      filter.campus = campus._id;
      filter.isActive = true;
    }

    else if (role === "super-admin") {
      if (includeInactive !== "true") {
        filter.isActive = true;
      }
    }

    else if (role === "teacher") {
      const classTeacherClasses = await Class.find({
        classTeacher: _id,
        isActive: true
      }).select("_id");

      const teacherAssignments = await TeacherAssignment.find({ teacher: _id })
        .populate({
          path: "assignments",
          match: { isActive: true },
          populate: {
            path: "class",
            select: "_id",
            match: { isActive: true }
          }
        });

      const subjectClassIds = [];
      teacherAssignments.forEach(t => {
        t.assignments.forEach(a => {
          if (a.class) subjectClassIds.push(a.class._id);
        });
      });

      const classTeacherIds = classTeacherClasses.map(c => c._id);

      const combinedClassIds = [
        ...new Set([...classTeacherIds, ...subjectClassIds])
      ];

      if (!combinedClassIds.length) {
        return res.json({ role, count: 0, data: [] });
      }

      filter._id = { $in: combinedClassIds };
      filter.isActive = true;
    }

    else {
      return res.status(403).json({ error: "Access denied" });
    }

    /** ---------------- PAGINATION ---------------- */
    const skip = (Number(page) - 1) * Number(limit);

    /** ---------------- AGGREGATION ---------------- */
    const classes = await Class.aggregate([
      { $match: filter },

      // campus
      {
        $lookup: {
          from: "campuses",
          localField: "campus",
          foreignField: "_id",
          as: "campus"
        }
      },
      {
        $unwind: {
          path: "$campus",
          preserveNullAndEmptyArrays: true
        }
      },

      // class teacher
      {
        $lookup: {
          from: "users",
          localField: "classTeacher",
          foreignField: "_id",
          as: "classTeacher"
        }
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subjects",
          foreignField: "_id",
          as: "subjects"
        }
      },
      {
        $unwind: {
          path: "$classTeacher",
          preserveNullAndEmptyArrays: true
        }
      },

      // students count (users with role = student in this class)
      {
        $lookup: {
          from: "studentenrollments",
          let: { classId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$class", "$$classId"] },
                isActive: true
              }
            }
          ],
          as: "enrollments"
        }
      },


      {
        $project: {
          grade: 1,
          section: 1,
          campusName: "$campus.name",
          classTeacherName: "$classTeacher.name",
          subjects: { $size: "$subjects" },
          studentsCount: { $size: "$enrollments" }
        }
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) }
    ]);
    const totalCount = await Class.countDocuments(filter)
    res.json({
      role,
      count: totalCount,
      page: Number(page),
      limit: Number(limit),
      data: classes
    });

  } catch (error) {
    logger.error(error);
    res.status(400).json({ error: error.message });
  }
};


export const getClassById = async (req, res) => {
  try {
    const { role, _id } = req.user
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Class ID is required" })
    }

    let filter = { _id: id }
    let subjectMap = {}

    if (role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: _id })
      if (!campus) {
        return res.status(404).json({ error: "No campus assigned to this admin" })
      }

      const classExists = await Class.findOne({ _id: id, campus: campus._id, isActive: true })
      if (!classExists) {
        return res.status(403).json({ error: "This class does not belong to your campus" })
      }
      filter.campus = campus._id
      filter.isActive = true
    }

    else if (role === "super-admin") {
      filter.isActive = true
    }

    else if (role === "teacher") {
      const classTeacher = await Class.findOne({ classTeacher: _id, isActive: true }).select("_id")
      const teacherAssignments = await TeacherAssignment.find({ teacher: _id })
        .populate({
          path: "assignments",
          match: { isActive: true },
          populate: [
            { path: "class", select: "_id", match: { isActive: true } },
            { path: "subject", select: "_id" },
          ],
        })

      teacherAssignments.forEach((ta) => {
        ta.assignments.forEach((a) => {
          if (a.class && a.subject) {
            const cId = a.class._id.toString()
            if (!subjectMap[cId]) subjectMap[cId] = []
            subjectMap[cId].push(a.subject._id)
          }
        })
      })

      const subjectTeacherClassIds = Object.keys(subjectMap)
      const classTeacherClassId = classTeacher?._id?.toString()
      const combinedClassIds = [
        ...new Set([...subjectTeacherClassIds, classTeacherClassId].filter(Boolean)),
      ]

      if (!combinedClassIds.includes(id)) {
        return res.status(403).json({ error: "You do not have access to this class" })
      }

      filter.isActive = true
    }

    else {
      return res.status(403).json({ error: "Access denied" })
    }

    let cls = await Class.findOne(filter)
      .populate("campus", "name code isActive")
      .populate("classTeacher", "name email role")
      .populate("subjects", "name code")
      .lean()

    if (!cls) {
      return res.status(404).json({ error: "Class not found" })
    }
    /** 🔥 FETCH STUDENTS VIA StudentEnrollment */
    const enrollments = await StudentEnrollment.find({
      class: cls._id,
      isActive: true
    })
      .populate("student", "name email")
      .select("student rollNumber academicSession")
      .lean();

    cls.students = enrollments.map(e => ({
      _id: e.student?._id,
      name: e.student?.name,
      email: e.student?.email,
      rollNumber: e.rollNumber,
      academicSession: e.academicSession
    }));

    if (role === "teacher") {
      const classId = cls._id.toString();
      const isClassTeacher = cls.classTeacher?._id?.toString() === _id.toString()

      if (!isClassTeacher && subjectMap[classId]) {
        cls.subjects = cls.subjects.filter((subj) =>
          subjectMap[classId].some((sid) => sid.toString() === subj._id.toString())
        )
      }
    }

    res.json({
      role,
      classId: cls._id,
      data: cls,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
};


export const updateClass = async (req, res) => {
  try {
    const { role, _id: userId } = req.user
    const classId = req.params.id
    const updateData = req.body

    const existingClass = await Class.findById(classId).populate("campus", "_id campusAdmin")
    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" })
    }

    if (role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: userId, isActive: true }).select("_id");
      if (!campus) {
        return res.status(403).json({ message: "No campus assigned to this admin" })
      }

      if (existingClass.campus._id.toString() !== campus._id.toString()) {
        return res.status(403).json({ message: "You can only update classes from your campus" })
      }
    } else if (role !== "super-admin") {
      return res.status(403).json({ message: "Access denied" })
    }

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      updateData,
      { new: true, runValidators: true }
    )

    res.json({
      message: "Class updated successfully",
      updatedClass
    })
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.classTeacher) {
      return res.status(400).json({
        message: "This teacher is already assigned as a class teacher for another class."
      })
    }
    res.status(400).json({ error: err.message })
  }
}


export const deleteClass = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const classId = req.params.id;

    const classDoc = await Class.findById(classId).populate("campus", "_id campusAdmin");
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: userId, isActive: true }).select("_id");
      if (!campus) {
        return res.status(403).json({ message: "No campus assigned to this admin" });
      }

      if (classDoc.campus._id.toString() !== campus._id.toString()) {
        return res.status(403).json({
          message: "You can only delete classes belonging to your campus",
        });
      }
    } else if (role !== "super-admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await Class.findByIdAndDelete(classId);

    res.json({
      message: "Class deleted permanently",
      deletedClassId: classId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

