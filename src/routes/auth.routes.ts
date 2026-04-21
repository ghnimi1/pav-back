import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// Public routes
router.post('/login', AuthController.login)
router.post('/register', AuthController.register)

// Protected routes
router.get('/me', authMiddleware, AuthController.me)
router.put('/profile', authMiddleware, AuthController.updateProfile)
router.post('/change-password', authMiddleware, AuthController.changePassword)
router.get('/loyalty/stats', authMiddleware, AuthController.getLoyaltyStats)

export default router