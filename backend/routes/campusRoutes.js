import { createCampus, getAllCampuses, getCampusById, updateCampusDetailsById, deleteCampusById, getCampusDetails, getAssignedCampusAdmins, getCampusSettings, updateCampusSettings } from '../controllers/campusController.js'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import { schemaValidation } from '../middlewares/validate.js'
import { campusValidator } from '../validators/campusValidator.js'
import express from 'express'
const router = express.Router()

router.post('/', schemaValidation(campusValidator), authenticate, authRole(['super-admin']), createCampus)
router.get('/', authenticate, authRole(['super-admin']), getAllCampuses)
router.get('/admins', authenticate, authRole(['super-admin']), getAssignedCampusAdmins)
router.get('/details', authenticate, authRole(['campus-admin', 'super-admin', 'teacher']), getCampusDetails)
router.get('/settings', authenticate, authRole(['campus-admin', 'teacher']), getCampusSettings)
router.put('/settings', authenticate, authRole(['campus-admin']), updateCampusSettings)
router.get('/:id', authenticate, authRole(['super-admin']), getCampusById)
router.patch('/:id', authenticate, authRole(['super-admin']), updateCampusDetailsById)
router.post('/:id/delete', authenticate, authRole(['super-admin']), deleteCampusById)
router.delete('/:id', authenticate, authRole(['super-admin']), deleteCampusById)

export default router