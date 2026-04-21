import { Router } from 'express'
import { authMiddleware, adminOnly } from '../middleware/auth.middleware'
import { MenuController } from '../controllers/menu.controller'

const router = Router()

// Public routes (no auth required for viewing menu)
router.get('/categories', MenuController.getActiveCategories)
router.get('/items', MenuController.getActiveItems)
router.get('/items/category/:categoryId', MenuController.getItemsByCategory)
router.get('/items/:id', MenuController.getItemById)
router.get('/supplements', MenuController.getActiveSupplements)
router.get('/offers/current', MenuController.getCurrentOffers)

// Protected routes (require auth)
router.use(authMiddleware)

// Categories (admin only)
router.get('/categories/all', adminOnly, MenuController.getAllCategories)
router.get('/categories/:id', adminOnly, MenuController.getCategoryById)
router.post('/categories', adminOnly, MenuController.createCategory)
router.put('/categories/:id', adminOnly, MenuController.updateCategory)
router.delete('/categories/:id', adminOnly, MenuController.deleteCategory)

// Items (admin only)
router.get('/items/all', adminOnly, MenuController.getAllItems)
router.post('/items', adminOnly, MenuController.createItem)
router.put('/items/:id', adminOnly, MenuController.updateItem)
router.delete('/items/:id', adminOnly, MenuController.deleteItem)
router.patch('/items/:id/toggle', adminOnly, MenuController.toggleAvailability)

// Supplements (admin only)
router.get('/supplements/all', adminOnly, MenuController.getAllSupplements)
router.get('/supplements/:id', adminOnly, MenuController.getSupplementById)
router.post('/supplements', adminOnly, MenuController.createSupplement)
router.put('/supplements/:id', adminOnly, MenuController.updateSupplement)
router.delete('/supplements/:id', adminOnly, MenuController.deleteSupplement)

// Offers (admin only)
router.get('/offers/all', adminOnly, MenuController.getAllOffers)
router.get('/offers/active', adminOnly, MenuController.getActiveOffers)
router.get('/offers/:id', adminOnly, MenuController.getOfferById)
router.post('/offers', adminOnly, MenuController.createOffer)
router.put('/offers/:id', adminOnly, MenuController.updateOffer)
router.delete('/offers/:id', adminOnly, MenuController.deleteOffer)

export default router