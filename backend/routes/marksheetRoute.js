import { getStudentMarksheet, updateMarksheetRemark } from '../controllers/marksheetController.js'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import express from 'express'
const router = express.Router()

router.get('/marksheet', authenticate, authRole(['campus-admin', 'teacher', 'student', 'super-admin']), getStudentMarksheet)
router.put('/marksheet/:id/remark', authenticate, authRole(['campus-admin', 'teacher', 'super-admin']), updateMarksheetRemark)

export default router