import { Router } from 'express'
import { authMiddleware, adminOnly } from '../middleware/auth.middleware'
import { MenuController } from '../controllers/menu.controller'
import { uploadMenuImage } from '../middleware/upload.middleware'

const router = Router()

// Public routes (no auth required for viewing menu)
router.get('/categories', MenuController.getActiveCategories)
router.get('/items', MenuController.getActiveItems)
router.get('/items/category/:categoryId', MenuController.getItemsByCategory)
router.get('/items/:id', MenuController.getItemById)
router.get('/supplements', MenuController.getActiveSupplements)
router.get('/offers/current', MenuController.getCurrentOffers)
router.get('/breakfast/categories', MenuController.getActiveBreakfastCategories)
router.get('/breakfast/items', MenuController.getActiveBreakfastItems)
router.get('/breakfast/items/category/:categoryId', MenuController.getBreakfastItemsByCategory)
router.get('/breakfast/formulas', MenuController.getActiveBreakfastFormulas)

// Protected routes (require auth)
router.use(authMiddleware)

// Categories (admin only)
router.get('/categories/all', authMiddleware, MenuController.getAllCategories)
router.get('/categories/:id', adminOnly, MenuController.getCategoryById)
router.post('/categories', adminOnly, MenuController.createCategory)
router.put('/categories/:id', adminOnly, MenuController.updateCategory)
router.delete('/categories/:id', adminOnly, MenuController.deleteCategory)

// Items (admin only)
router.get('/items/all', authMiddleware, MenuController.getAllItems)
router.post('/items', adminOnly, uploadMenuImage.single('imageFile'), MenuController.createItem)
router.put('/items/:id', adminOnly, uploadMenuImage.single('imageFile'), MenuController.updateItem)
router.delete('/items/:id', adminOnly, MenuController.deleteItem)
router.patch('/items/:id/toggle', adminOnly, MenuController.toggleAvailability)

// Supplement Categories routes
router.get('/supplement-categories', authMiddleware, MenuController.getAllSupplementCategories)
router.get('/supplement-categories/active', MenuController.getActiveSupplementCategories)
router.get('/supplement-categories/:id', adminOnly, MenuController.getSupplementCategoryById)
router.post('/supplement-categories', adminOnly, MenuController.createSupplementCategory)
router.put('/supplement-categories/:id', adminOnly, MenuController.updateSupplementCategory)
router.delete('/supplement-categories/:id', adminOnly, MenuController.deleteSupplementCategory)

// Supplements (admin only)
router.get('/supplements/all', MenuController.getAllSupplements)
router.get('/supplements/:id', adminOnly, MenuController.getSupplementById)
router.post('/supplements', adminOnly, MenuController.createSupplement)
router.put('/supplements/:id', adminOnly, MenuController.updateSupplement)
router.delete('/supplements/:id', adminOnly, MenuController.deleteSupplement)

// Offers (admin only)
router.get('/offers/all', authMiddleware, MenuController.getAllOffers)
router.get('/offers/active', adminOnly, MenuController.getActiveOffers)
router.get('/offers/:id', adminOnly, MenuController.getOfferById)
router.post('/offers', adminOnly, MenuController.createOffer)
router.put('/offers/:id', adminOnly, MenuController.updateOffer)
router.delete('/offers/:id', adminOnly, MenuController.deleteOffer)

// Breakfast module (admin only)
router.get('/breakfast/categories/all', adminOnly, MenuController.getAllBreakfastCategories)
router.post('/breakfast/categories', adminOnly, MenuController.createBreakfastCategory)
router.put('/breakfast/categories/:id', adminOnly, MenuController.updateBreakfastCategory)
router.delete('/breakfast/categories/:id', adminOnly, MenuController.deleteBreakfastCategory)

router.get('/breakfast/items/all', adminOnly, MenuController.getAllBreakfastItems)
router.post('/breakfast/items', adminOnly, uploadMenuImage.single('imageFile'), MenuController.createBreakfastItem)
router.put('/breakfast/items/:id', adminOnly, uploadMenuImage.single('imageFile'), MenuController.updateBreakfastItem)
router.delete('/breakfast/items/:id', adminOnly, MenuController.deleteBreakfastItem)

router.get('/breakfast/formulas/all', adminOnly, MenuController.getAllBreakfastFormulas)
router.post('/breakfast/formulas', adminOnly, uploadMenuImage.single('imageFile'), MenuController.createBreakfastFormula)
router.put('/breakfast/formulas/:id', adminOnly, uploadMenuImage.single('imageFile'), MenuController.updateBreakfastFormula)
router.delete('/breakfast/formulas/:id', adminOnly, MenuController.deleteBreakfastFormula)

export default router
