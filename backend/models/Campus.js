import Class from "./Class.js";
import User from "./User.js";
import StudentEnrollment from "./StudentEnrollment.js";
import Assignment from "./Assignment.js";
import TeacherAssignment from "./TeacherAssignment.js";
import { model, Schema } from "mongoose";

const campusSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0,0] }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
   campusAdmin: { type: Schema.Types.ObjectId, ref: "User", required: true },
   isActive: {type:Boolean, default: true},
   attendanceMode: {
     type: String,
     enum: ['self', 'admin'],
     default: 'self',
   },
}, { timestamps: true });

campusSchema.index({ location: '2dsphere' });

campusSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
)

campusSchema.post("findOneAndUpdate", async function (doc) {
  if (doc && doc.isActive === false) {
    // 1. Deactivate all classes belonging to this campus
    await Class.updateMany({ campus: doc._id }, { isActive: false });

    // 2. Deactivate student enrollments in this campus
    await StudentEnrollment.updateMany({ campus: doc._id }, { isActive: false });

    // 3. Find student user IDs enrolled in this campus and set inactive
    const studentUserIds = await StudentEnrollment.distinct("student", { campus: doc._id });
    
    // 4. Find teacher assignments for this campus
    const campusAssignments = await Assignment.distinct("_id", { campus: doc._id });
    const teacherAssignments = await TeacherAssignment.find({ assignments: { $in: campusAssignments } }).select("teacher");
    const teacherUserIds = teacherAssignments.map(ta => ta.teacher);

    const affectedUserIds = [...studentUserIds, ...teacherUserIds];

    if (affectedUserIds.length > 0) {
      await User.updateMany(
        { _id: { $in: affectedUserIds }, role: { $in: ["teacher", "student"] } },
        { isActive: false }
      );
    }
  }
});

export default model("Campus", campusSchema);