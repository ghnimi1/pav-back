// backend/src/routes/production.routes.ts
import { Router } from 'express'
import { authMiddleware, adminOnly } from '../middleware/auth.middleware'
import { ProductionController } from '../controllers/production.controller'

const router = Router()

router.use(authMiddleware)

// Recipe Categories
router.get('/recipe-categories', ProductionController.getAllRecipeCategories)
router.post('/recipe-categories', adminOnly, ProductionController.createRecipeCategory)
router.put('/recipe-categories/:id', adminOnly, ProductionController.updateRecipeCategory)
router.delete('/recipe-categories/:id', adminOnly, ProductionController.deleteRecipeCategory)

// Recipes
router.get('/recipes', ProductionController.getAllRecipes)
router.get('/recipes/check-ingredients', ProductionController.checkIngredients)
router.get('/recipes/:id', ProductionController.getRecipeById)
router.post('/recipes', adminOnly, ProductionController.createRecipe)
router.put('/recipes/:id', adminOnly, ProductionController.updateRecipe)
router.delete('/recipes/:id', adminOnly, ProductionController.deleteRecipe)

// Showcases
router.get('/showcases', ProductionController.getAllShowcases)
router.post('/showcases', adminOnly, ProductionController.createShowcase)
router.put('/showcases/:id', adminOnly, ProductionController.updateShowcase)
router.delete('/showcases/:id', adminOnly, ProductionController.deleteShowcase)

// Production Orders
router.get('/orders', ProductionController.getAllProductionOrders)
router.get('/orders/today', ProductionController.getTodayProductionOrders)
router.get('/orders/status/:status', ProductionController.getProductionOrdersByStatus)
router.get('/orders/:id', ProductionController.getProductionOrderById)
router.post('/orders', adminOnly, ProductionController.createProductionOrder)
router.put('/orders/:id', adminOnly, ProductionController.updateProductionOrder)
router.post('/orders/:id/start', adminOnly, ProductionController.startProduction)
router.post('/orders/:id/complete', adminOnly, ProductionController.completeProduction)
router.post('/orders/:id/cancel', adminOnly, ProductionController.cancelProduction)
router.delete('/orders/:id', adminOnly, ProductionController.deleteProductionOrder)

// Showcase Items
router.get('/items', ProductionController.getShowcaseItems)
router.get('/items/available', ProductionController.getAvailableItems)
router.get('/items/expiring', ProductionController.getExpiringItems)
router.get('/items/low', ProductionController.getLowStockItems)
router.get('/items/available-recipes', ProductionController.getAvailableRecipes)
router.get('/items/check-availability', ProductionController.checkAvailability)
router.put('/items/:id', adminOnly, ProductionController.updateShowcaseItem)
router.post('/items/:id/transfer', adminOnly, ProductionController.transferShowcaseItem)
router.post('/items/decrement-stock', adminOnly, ProductionController.decrementStock)
router.delete('/items/:id', adminOnly, ProductionController.deleteShowcaseItem)

// Stats
router.get('/stats', ProductionController.getProductionStats)

export default router
