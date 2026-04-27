import { Router } from 'express'
import { authMiddleware, adminOnly } from '../middleware/auth.middleware'
import { StockController } from '../controllers/stock.controller'
import { uploadMenuImage } from '../middleware/upload.middleware'

const router = Router()

// Toutes les routes stock nécessitent authentification
router.use(authMiddleware)

// ========== CATEGORIES ==========
router.get('/categories', StockController.getAllCategories)
router.get('/categories/:id', StockController.getCategoryById)
router.post('/categories', adminOnly, StockController.createCategory)
router.put('/categories/:id', adminOnly, StockController.updateCategory)
router.delete('/categories/:id', adminOnly, StockController.deleteCategory)

// ========== SUB-CATEGORIES ==========
router.get('/subcategories', StockController.getAllSubCategories)
router.get('/subcategories/:id', StockController.getSubCategoryById)
router.get('/subcategories/category/:categoryId', StockController.getSubCategoriesByCategory)
router.post('/subcategories', adminOnly, StockController.createSubCategory)
router.put('/subcategories/:id', adminOnly, StockController.updateSubCategory)
router.delete('/subcategories/:id', adminOnly, StockController.deleteSubCategory)

// ========== PRODUCTS ==========
router.get('/products', StockController.getAllProducts)
router.get('/products/:id', StockController.getProductById)
router.get('/products/subcategory/:subCategoryId', StockController.getProductsBySubCategory)
router.post('/products', adminOnly, StockController.createProduct)
router.put('/products/:id', adminOnly, StockController.updateProduct)
router.delete('/products/:id', adminOnly, StockController.deleteProduct)
router.get('/products/:id/stock', StockController.getProductStock)
router.get('/products/low-stock', StockController.getLowStockProducts)

// ========== BATCHES ==========
router.get('/batches/product/:productId', StockController.getBatchesByProduct)
router.get('/batches/product/:productId/active', StockController.getActiveBatches)
router.post('/batches', adminOnly, StockController.createBatch)
router.put('/batches/:id', adminOnly, StockController.updateBatch)
router.delete('/batches/:id', adminOnly, StockController.deleteBatch)
router.post('/batches/:id/open', adminOnly, StockController.openBatch)
router.post('/batches/consume', adminOnly, StockController.consumeStock)

// ========== ALERTS & STATS ==========
router.get('/alerts/expiring', StockController.getExpiringBatches)
router.get('/stats', StockController.getStockStats)
router.get('/stats/value', StockController.getTotalStockValue)

// ========== REWARDS ==========
router.get('/rewards', StockController.getAllRewards)
router.get('/rewards/:id', StockController.getRewardById)
router.post('/rewards', adminOnly, uploadMenuImage.single('imageFile'), StockController.createReward)
router.put('/rewards/:id', adminOnly, uploadMenuImage.single('imageFile'), StockController.updateReward)
router.delete('/rewards/:id', adminOnly, StockController.deleteReward)

export default router
