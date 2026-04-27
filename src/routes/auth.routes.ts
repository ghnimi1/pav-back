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
router.get('/missions', authMiddleware, AuthController.getMissions)
router.post('/missions', authMiddleware, AuthController.createMission)
router.put('/missions/:id', authMiddleware, AuthController.updateMission)
router.delete('/missions/:id', authMiddleware, AuthController.deleteMission)
router.get('/special-days', authMiddleware, AuthController.getSpecialDays)
router.post('/special-days', authMiddleware, AuthController.createSpecialDay)
router.put('/special-days/:id', authMiddleware, AuthController.updateSpecialDay)
router.delete('/special-days/:id', authMiddleware, AuthController.deleteSpecialDay)
router.get('/client-missions', authMiddleware, AuthController.getClientMissions)
router.put('/client-missions', authMiddleware, AuthController.saveClientMission)
router.get('/referral-config', authMiddleware, AuthController.getReferralConfig)
router.put('/referral-config', authMiddleware, AuthController.updateReferralConfig)
router.post('/loyalty/points', authMiddleware, AuthController.awardLoyaltyPoints)
router.put('/loyalty/client', authMiddleware, AuthController.updateLoyaltyClient)
router.get('/clients', authMiddleware, AuthController.getClients)
router.get('/referrals', authMiddleware, AuthController.getReferrals)
router.post('/referrals/:id/validate', authMiddleware, AuthController.validateReferralFirstPurchase)
router.get('/employees', authMiddleware, AuthController.getEmployees)
router.post('/employees', authMiddleware, AuthController.createEmployee)
router.put('/employees/:id', authMiddleware, AuthController.updateEmployee)
router.delete('/employees/:id', authMiddleware, AuthController.deleteEmployee)

export default router
