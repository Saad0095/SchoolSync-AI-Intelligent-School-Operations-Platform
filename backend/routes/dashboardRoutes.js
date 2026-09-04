import { getCampusComparison, getDropRatio, getOverviewStats, getTopPerformers, getTeacherOverview, getClassPerformance, getAttendanceOverview, getTeacherQuickStats, getStudentOverview, getParentOverview } from '../controllers/dashboardController.js'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import express from 'express'
const router = express.Router()

// For Super Admin Only
router.get('/super-admin/getCampusComparison', authenticate, authRole([ 'super-admin']), getCampusComparison)

// For Super Admin + Campus Admin Only
router.get('/getOverview', authenticate, authRole(['campus-admin', 'super-admin']), getOverviewStats)
router.get('/getTopPerformers', authenticate, authRole(['campus-admin','super-admin']), getTopPerformers)
router.get('/getDropRatio', authenticate, authRole(['campus-admin', 'super-admin']), getDropRatio)

// For Teachers Only
router.get('/teacher/overview', authenticate, authRole(['teacher']), getTeacherOverview)
router.get('/teacher/class-performance', authenticate, authRole(['teacher']), getClassPerformance)
router.get('/teacher/attendance-overview', authenticate, authRole(['teacher']), getAttendanceOverview)
router.get('/teacher/quick-stats', authenticate, authRole(['teacher']), getTeacherQuickStats)

// For Students Only
router.get('/student/overview', authenticate, authRole(['student']), getStudentOverview)

// For Parents Only
router.get('/parent/overview', authenticate, authRole(['parent']), getParentOverview)

export default router