import { createExam, getAllExams, updateExam, deleteExam } from '../controllers/examController.js'
import {authenticate, authRole} from '../middlewares/authMiddleware.js'
import { schemaValidation } from '../middlewares/validate.js'
import { examValidation } from '../validators/examValidator.js'

import express from 'express'
const router = express.Router()

router.post('/', schemaValidation(examValidation), authenticate, authRole(['super-admin', 'campus-admin']), createExam)
router.get('/', authenticate, authRole(['super-admin', 'campus-admin', 'teacher']), getAllExams)
router.patch('/:examId', authenticate, authRole(['super-admin', 'campus-admin']), updateExam)
router.delete('/:examId/delete', authenticate, authRole(['super-admin', 'campus-admin']), deleteExam)

export default router