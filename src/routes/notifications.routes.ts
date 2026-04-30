import { Router } from 'express'
import { NotificationsController } from '../controllers/notifications.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

router.get('/', NotificationsController.getMyNotifications)
router.post('/', NotificationsController.createNotification)
router.patch('/read-all', NotificationsController.markAllAsRead)
router.patch('/:id/read', NotificationsController.markAsRead)
router.delete('/', NotificationsController.clearNotifications)
router.delete('/:id', NotificationsController.deleteNotification)

export default router
