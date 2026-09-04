import express from 'express';
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
