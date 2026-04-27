import fs from 'node:fs/promises'
import type { Request, Response } from 'express'
import { categoryService, subCategoryService, productService, batchService, rewardService } from '../services/stock.service'
import { getLocalUploadAbsolutePath, getUploadedImagePath } from '../middleware/upload.middleware'

// Helper function to get string from params
function getParamString(param: string | string[] | undefined): string | undefined {
  if (!param) return undefined
  if (Array.isArray(param)) return param[0]
  return param
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return undefined
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

function parseRewardPayload(req: Request) {
  const body = req.body as Record<string, unknown>
  const imageFromUpload = getUploadedImagePath(req.file)
  const removeImage = parseBoolean(body.removeImage) === true
  const result: Record<string, unknown> = {}

  if (typeof body.name === 'string' && body.name.trim() !== '') result.name = body.name
  if (typeof body.description === 'string') result.description = body.description
  if (body.pointsCost !== undefined && body.pointsCost !== null && body.pointsCost !== '') {
    result.pointsCost = parseNumber(body.pointsCost)
  }
  if (typeof body.type === 'string' && body.type.trim() !== '') result.type = body.type
  if (typeof body.value === 'string') result.value = body.value
  if (body.isActive !== undefined && body.isActive !== null) result.isActive = parseBoolean(body.isActive)

  if (removeImage) {
    result.image = undefined
  } else if (imageFromUpload) {
    result.image = imageFromUpload
  } else if (typeof body.image === 'string' && body.image.trim() !== '') {
    result.image = body.image
  }

  return result
}

async function removeLocalImageIfNeeded(imagePath?: string) {
  const absolutePath = getLocalUploadAbsolutePath(imagePath)
  if (!absolutePath) return

  try {
    await fs.unlink(absolutePath)
  } catch {
    // Ignore missing files
  }
}

export const StockController = {
  // ============================================
  // CATEGORIES
  // ============================================
  
  async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await categoryService.getAllCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get all categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération des catégories' })
    }
  },
  
  async getCategoryById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const category = await categoryService.getCategoryById(id)
      if (!category) {
        return res.status(404).json({ success: false, error: 'Catégorie non trouvée' })
      }
      res.json({ success: true, data: category })
    } catch (error) {
      console.error('Get category by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createCategory(req: Request, res: Response) {
    try {
      const category = await categoryService.createCategory(req.body)
      res.status(201).json({ success: true, data: category, message: 'Catégorie créée avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async updateCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await categoryService.updateCategory(id, req.body)
      res.json({ success: true, message: 'Catégorie mise à jour avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async deleteCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await categoryService.deleteCategory(id)
      res.json({ success: true, message: 'Catégorie supprimée avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  // ============================================
  // SUB-CATEGORIES
  // ============================================
  
  async getAllSubCategories(req: Request, res: Response) {
    try {
      const subCategories = await subCategoryService.getAllSubCategories()
      res.json({ success: true, data: subCategories })
    } catch (error) {
      console.error('Get all subcategories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getSubCategoriesByCategory(req: Request, res: Response) {
    try {
      const categoryId = getParamString(req.params.categoryId)
      if (!categoryId) {
        return res.status(400).json({ success: false, error: 'categoryId requis' })
      }
      const subCategories = await subCategoryService.getSubCategoriesByCategory(categoryId)
      res.json({ success: true, data: subCategories })
    } catch (error) {
      console.error('Get subcategories by category error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getSubCategoryById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const subCategory = await subCategoryService.getSubCategoryById(id)
      if (!subCategory) {
        return res.status(404).json({ success: false, error: 'Sous-catégorie non trouvée' })
      }
      res.json({ success: true, data: subCategory })
    } catch (error) {
      console.error('Get subcategory by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createSubCategory(req: Request, res: Response) {
    try {
      const subCategory = await subCategoryService.createSubCategory(req.body)
      res.status(201).json({ success: true, data: subCategory, message: 'Sous-catégorie créée avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async updateSubCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await subCategoryService.updateSubCategory(id, req.body)
      res.json({ success: true, message: 'Sous-catégorie mise à jour avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async deleteSubCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await subCategoryService.deleteSubCategory(id)
      res.json({ success: true, message: 'Sous-catégorie supprimée avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  // ============================================
  // PRODUCTS
  // ============================================
  
  async getAllProducts(req: Request, res: Response) {
    try {
      const products = await productService.getAllProducts()
      res.json({ success: true, data: products })
    } catch (error) {
      console.error('Get all products error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération des produits' })
    }
  },
  
  async getProductById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const product = await productService.getProductById(id)
      if (!product) {
        return res.status(404).json({ success: false, error: 'Produit non trouvé' })
      }
      res.json({ success: true, data: product })
    } catch (error) {
      console.error('Get product by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getProductsBySubCategory(req: Request, res: Response) {
    try {
      const subCategoryId = getParamString(req.params.subCategoryId)
      if (!subCategoryId) {
        return res.status(400).json({ success: false, error: 'subCategoryId requis' })
      }
      const products = await productService.getProductsBySubCategory(subCategoryId)
      res.json({ success: true, data: products })
    } catch (error) {
      console.error('Get products by subcategory error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createProduct(req: Request, res: Response) {
    try {
      const product = await productService.createProduct(req.body)
      res.status(201).json({ success: true, data: product, message: 'Produit créé avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async updateProduct(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await productService.updateProduct(id, req.body)
      res.json({ success: true, message: 'Produit mis à jour avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async deleteProduct(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await productService.deleteProduct(id)
      res.json({ success: true, message: 'Produit supprimé avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async getProductStock(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const stock = await productService.getProductStock(id)
      res.json({ success: true, data: { productId: id, stock } })
    } catch (error) {
      console.error('Get product stock error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération du stock' })
    }
  },
  
  async getLowStockProducts(req: Request, res: Response) {
    try {
      const lowStockProducts = await productService.getLowStockProducts()
      res.json({ success: true, data: lowStockProducts })
    } catch (error) {
      console.error('Get low stock products error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  // ============================================
  // BATCHES
  // ============================================
  
  async getBatchesByProduct(req: Request, res: Response) {
    try {
      const productId = getParamString(req.params.productId)
      if (!productId) {
        return res.status(400).json({ success: false, error: 'productId requis' })
      }
      const batches = await batchService.getBatchesByProduct(productId)
      res.json({ success: true, data: batches })
    } catch (error) {
      console.error('Get batches by product error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getActiveBatches(req: Request, res: Response) {
    try {
      const productId = getParamString(req.params.productId)
      if (!productId) {
        return res.status(400).json({ success: false, error: 'productId requis' })
      }
      const batches = await batchService.getActiveBatches(productId)
      res.json({ success: true, data: batches })
    } catch (error) {
      console.error('Get active batches error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createBatch(req: Request, res: Response) {
    try {
      const batch = await batchService.createBatch(req.body)
      res.status(201).json({ success: true, data: batch, message: 'Lot créé avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création du lot'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async updateBatch(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await batchService.updateBatch(id, req.body)
      res.json({ success: true, message: 'Lot mis à jour avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async deleteBatch(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await batchService.deleteBatch(id)
      res.json({ success: true, message: 'Lot supprimé avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async openBatch(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      const { openingDate, productShelfLife } = req.body
      
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      if (!openingDate) {
        return res.status(400).json({ success: false, error: 'Date d\'ouverture requise' })
      }
      
      await batchService.openBatch(id, new Date(openingDate), productShelfLife)
      res.json({ success: true, message: 'Lot ouvert avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ouverture du lot'
      res.status(400).json({ success: false, error: message })
    }
  },
  
  async consumeStock(req: Request, res: Response) {
    try {
      const { productId, quantity } = req.body
      
      if (!productId) {
        return res.status(400).json({ success: false, error: 'productId requis' })
      }
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'Quantité valide requise' })
      }
      
      const success = await batchService.consumeStock(productId, quantity)
      if (!success) {
        return res.status(400).json({ success: false, error: 'Stock insuffisant' })
      }
      res.json({ success: true, message: 'Stock consommé avec succès' })
    } catch (error) {
      console.error('Consume stock error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la consommation du stock' })
    }
  },
  
  // ============================================
  // ALERTS & STATS
  // ============================================
  
  async getExpiringBatches(req: Request, res: Response) {
    try {
      const daysParam = req.query.days
      const days = typeof daysParam === 'string' ? parseInt(daysParam) : 30
      const expiringBatches = await batchService.getExpiringBatches(days)
      res.json({ success: true, data: expiringBatches })
    } catch (error) {
      console.error('Get expiring batches error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getStockStats(req: Request, res: Response) {
    try {
      const stats = await batchService.getStockStats()
      res.json({ success: true, data: stats })
    } catch (error) {
      console.error('Get stock stats error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération des statistiques' })
    }
  },
  
  async getTotalStockValue(req: Request, res: Response) {
    try {
      const totalValue = await batchService.getTotalStockValue()
      res.json({ success: true, data: { totalValue } })
    } catch (error) {
      console.error('Get total stock value error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },

  // ============================================
  // REWARDS
  // ============================================

  async getAllRewards(req: Request, res: Response) {
    try {
      const activeOnly = req.query.active === 'true'
      const rewards = await rewardService.getAllRewards(activeOnly)
      res.json({ success: true, data: rewards })
    } catch (error) {
      console.error('Get all rewards error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des recompenses' })
    }
  },

  async getRewardById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      const reward = await rewardService.getRewardById(id)
      if (!reward) {
        return res.status(404).json({ success: false, error: 'Recompense non trouvee' })
      }

      res.json({ success: true, data: reward })
    } catch (error) {
      console.error('Get reward by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async createReward(req: Request, res: Response) {
    try {
      const reward = await rewardService.createReward(parseRewardPayload(req) as any)
      res.status(201).json({ success: true, data: reward, message: 'Recompense creee avec succes' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la creation'
      res.status(400).json({ success: false, error: message })
    }
  },

  async updateReward(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      const currentReward = await rewardService.getRewardById(id)
      if (!currentReward) {
        return res.status(404).json({ success: false, error: 'Recompense non trouvee' })
      }

      const payload = parseRewardPayload(req)
      await rewardService.updateReward(id, payload as any)

      const nextImage = typeof payload.image === 'string' ? payload.image : undefined
      if ((req.file || parseBoolean((req.body as Record<string, unknown>).removeImage) === true) && currentReward.image !== nextImage) {
        await removeLocalImageIfNeeded(currentReward.image)
      }

      res.json({ success: true, message: 'Recompense mise a jour avec succes' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise a jour'
      res.status(400).json({ success: false, error: message })
    }
  },

  async deleteReward(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      const currentReward = await rewardService.getRewardById(id)
      if (!currentReward) {
        return res.status(404).json({ success: false, error: 'Recompense non trouvee' })
      }

      await rewardService.deleteReward(id)
      await removeLocalImageIfNeeded(currentReward.image)
      res.json({ success: true, message: 'Recompense supprimee avec succes' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression'
      res.status(400).json({ success: false, error: message })
    }
  }
}
