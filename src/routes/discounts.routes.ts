import { Router } from 'express'
import { DiscountsController } from '../controllers/discounts.controller'
import { adminOnly, authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/config', DiscountsController.getConfig)
router.put('/config', authMiddleware, adminOnly, DiscountsController.updateConfig)

export default router
