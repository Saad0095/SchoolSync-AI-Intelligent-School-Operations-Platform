import { assignTeacher, updateTeacher, deleteTeacher, getTeachers, enrollStudent, updateStudentEnrollment, deleteStudentEnrollment, getStudentEnrollments, getUnassignedTeachers } from '../controllers/enrollmentController.js'
import express from 'express'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import { schemaValidation } from '../middlewares/validate.js'
import { teacherAssignmentSchema } from '../validators/teacherAssignmentValidator.js'
import { studentAssignmentSchema } from '../validators/studentAssignmentValidator.js'
const router = express.Router()


//----------------------------------------------------------------------
// --- Teacher Assignment Routes -- //
//----------------------------------------------------------------------
router.post('/assign-teacher', schemaValidation(teacherAssignmentSchema), authenticate, authRole(['super-admin', 'campus-admin']), assignTeacher)
router.get('/teacher-assignments', authenticate, authRole(['super-admin', 'campus-admin']), getTeachers)
router.get('/unassigned-teachers', authenticate, authRole(['super-admin', 'campus-admin']), getUnassignedTeachers)
router.patch('/assign-teacher/:id', authenticate, authRole(['super-admin', 'campus-admin']), updateTeacher)
router.post('/assign-teacher/:id/delete', authenticate, authRole(['super-admin', 'campus-admin']), deleteTeacher)
//----------------------------------------------------------------------
// --- Student Enrollment Routes -- //
//----------------------------------------------------------------------
router.post('/enroll-student', schemaValidation(studentAssignmentSchema), authenticate, authRole(['super-admin', 'campus-admin']), enrollStudent)
router.get('/', authenticate, authRole(['super-admin', 'campus-admin', 'teacher']), getStudentEnrollments)
router.get('/student-enrollments', authenticate, authRole(['super-admin', 'campus-admin', 'teacher']), getStudentEnrollments)
router.patch('/enroll-student/:id', authenticate, authRole(['super-admin', 'campus-admin']), updateStudentEnrollment)
router.post('/enroll-student/:id/delete', authenticate, authRole(['super-admin', 'campus-admin']), deleteStudentEnrollment)

export default router