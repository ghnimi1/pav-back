// backend/src/controllers/production.controller.ts

import type { Request, Response } from 'express'
import { 
  recipeCategoryService, 
  recipeService, 
  showcaseService, 
  productionOrderService, 
  showcaseItemService,
  productionStatsService
} from '../services/production.service'
import type { ParsedQs } from 'qs'

// Helper function to get string from params (for req.params)
function getParamString(param: string | string[] | undefined): string | undefined {
  if (!param) return undefined
  if (Array.isArray(param)) return param[0]
  return param
}

// Helper function to get string from query (for req.query with ParsedQs)
function getQueryString(param: string | ParsedQs | (string | ParsedQs)[] | undefined): string | undefined {
  if (!param) return undefined
  if (Array.isArray(param)) return String(param[0])
  if (typeof param === 'object') return undefined
  return param
}

export const ProductionController = {
  // ============================================
  // RECIPE CATEGORIES
  // ============================================
  
  async getAllRecipeCategories(req: Request, res: Response) {
    try {
      const categories = await recipeCategoryService.getAll()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get all recipe categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération des catégories' })
    }
  },
  
  async getActiveRecipeCategories(req: Request, res: Response) {
    try {
      const categories = await recipeCategoryService.getActive()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get active recipe categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getRecipeCategoryById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const category = await recipeCategoryService.getById(id)
      if (!category) {
        return res.status(404).json({ success: false, error: 'Catégorie non trouvée' })
      }
      res.json({ success: true, data: category })
    } catch (error) {
      console.error('Get recipe category by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createRecipeCategory(req: Request, res: Response) {
    try {
      const category = await recipeCategoryService.create(req.body)
      res.status(201).json({ success: true, data: category, message: 'Catégorie créée avec succès' })
    } catch (error: any) {
      console.error('Create recipe category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la création' })
    }
  },
  
  async updateRecipeCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await recipeCategoryService.update(id, req.body)
      res.json({ success: true, message: 'Catégorie mise à jour avec succès' })
    } catch (error: any) {
      console.error('Update recipe category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' })
    }
  },
  
  async deleteRecipeCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await recipeCategoryService.delete(id)
      res.json({ success: true, message: 'Catégorie supprimée avec succès' })
    } catch (error: any) {
      console.error('Delete recipe category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },
  
  // ============================================
  // RECIPES
  // ============================================
  
  async getAllRecipes(req: Request, res: Response) {
    try {
      const recipes = await recipeService.getAll()
      res.json({ success: true, data: recipes })
    } catch (error) {
      console.error('Get all recipes error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération des recettes' })
    }
  },
  
  async getActiveRecipes(req: Request, res: Response) {
    try {
      const recipes = await recipeService.getActive()
      res.json({ success: true, data: recipes })
    } catch (error) {
      console.error('Get active recipes error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getRecipesByCategory(req: Request, res: Response) {
    try {
      const categoryId = getParamString(req.params.categoryId)
      if (!categoryId) {
        return res.status(400).json({ success: false, error: 'categoryId requis' })
      }
      const recipes = await recipeService.getByCategory(categoryId)
      res.json({ success: true, data: recipes })
    } catch (error) {
      console.error('Get recipes by category error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getRecipeById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const recipe = await recipeService.getWithCost(id)
      if (!recipe) {
        return res.status(404).json({ success: false, error: 'Recette non trouvée' })
      }
      res.json({ success: true, data: recipe })
    } catch (error) {
      console.error('Get recipe by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createRecipe(req: Request, res: Response) {
    try {
      const recipe = await recipeService.create(req.body)
      res.status(201).json({ success: true, data: recipe, message: 'Recette créée avec succès' })
    } catch (error: any) {
      console.error('Create recipe error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la création' })
    }
  },
  
  async updateRecipe(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await recipeService.update(id, req.body)
      res.json({ success: true, message: 'Recette mise à jour avec succès' })
    } catch (error: any) {
      console.error('Update recipe error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' })
    }
  },
  
  async deleteRecipe(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await recipeService.delete(id)
      res.json({ success: true, message: 'Recette supprimée avec succès' })
    } catch (error: any) {
      console.error('Delete recipe error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },
  
  async checkIngredients(req: Request, res: Response) {
    try {
      const recipeId = getQueryString(req.query.recipeId)
      if (!recipeId) {
        return res.status(400).json({ success: false, error: 'recipeId requis' })
      }
      let qty = 1
      const quantityParam = req.query.quantity
      if (typeof quantityParam === 'string') {
        qty = parseInt(quantityParam) || 1
      } else if (typeof quantityParam === 'number') {
        qty = quantityParam
      }
      const result = await recipeService.checkIngredientAvailability(recipeId, qty)
      res.json({ success: true, data: result })
    } catch (error: any) {
      console.error('Check ingredients error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la vérification' })
    }
  },
  
  // ============================================
  // SHOWCASES
  // ============================================
  
  async getAllShowcases(req: Request, res: Response) {
    try {
      const showcases = await showcaseService.getAll()
      res.json({ success: true, data: showcases })
    } catch (error) {
      console.error('Get all showcases error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération des vitrines' })
    }
  },
  
  async getActiveShowcases(req: Request, res: Response) {
    try {
      const showcases = await showcaseService.getActive()
      res.json({ success: true, data: showcases })
    } catch (error) {
      console.error('Get active showcases error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getShowcaseById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const showcase = await showcaseService.getById(id)
      if (!showcase) {
        return res.status(404).json({ success: false, error: 'Vitrine non trouvée' })
      }
      res.json({ success: true, data: showcase })
    } catch (error) {
      console.error('Get showcase by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createShowcase(req: Request, res: Response) {
    try {
      const showcase = await showcaseService.create(req.body)
      res.status(201).json({ success: true, data: showcase, message: 'Vitrine créée avec succès' })
    } catch (error: any) {
      console.error('Create showcase error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la création' })
    }
  },
  
  async updateShowcase(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await showcaseService.update(id, req.body)
      res.json({ success: true, message: 'Vitrine mise à jour avec succès' })
    } catch (error: any) {
      console.error('Update showcase error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' })
    }
  },
  
  async deleteShowcase(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await showcaseService.delete(id)
      res.json({ success: true, message: 'Vitrine supprimée avec succès' })
    } catch (error: any) {
      console.error('Delete showcase error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },
  
  // ============================================
  // PRODUCTION ORDERS
  // ============================================
  
  async getAllProductionOrders(req: Request, res: Response) {
    try {
      const orders = await productionOrderService.getAll()
      res.json({ success: true, data: orders })
    } catch (error) {
      console.error('Get all production orders error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération des ordres de production' })
    }
  },
  
  async getProductionOrdersByStatus(req: Request, res: Response) {
    try {
      const status = getParamString(req.params.status)
      if (!status) {
        return res.status(400).json({ success: false, error: 'Status requis' })
      }
      const orders = await productionOrderService.getByStatus(status as any)
      res.json({ success: true, data: orders })
    } catch (error) {
      console.error('Get production orders by status error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getTodayProductionOrders(req: Request, res: Response) {
    try {
      const orders = await productionOrderService.getToday()
      res.json({ success: true, data: orders })
    } catch (error) {
      console.error('Get today production orders error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getProductionOrderById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const order = await productionOrderService.getById(id)
      if (!order) {
        return res.status(404).json({ success: false, error: 'Ordre de production non trouvé' })
      }
      res.json({ success: true, data: order })
    } catch (error) {
      console.error('Get production order by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createProductionOrder(req: Request, res: Response) {
    try {
      const order = await productionOrderService.create(req.body)
      res.status(201).json({ success: true, data: order, message: 'Ordre de production créé avec succès' })
    } catch (error: any) {
      console.error('Create production order error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la création' })
    }
  },
  
  async updateProductionOrder(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await productionOrderService.update(id, req.body)
      res.json({ success: true, message: 'Ordre de production mis à jour avec succès' })
    } catch (error: any) {
      console.error('Update production order error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' })
    }
  },
  
  async startProduction(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      const { employeeId } = req.body
      
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      if (!employeeId) {
        return res.status(400).json({ success: false, error: 'employeeId requis' })
      }
      
      await productionOrderService.startProduction(id, employeeId)
      res.json({ success: true, message: 'Production démarrée avec succès' })
    } catch (error: any) {
      console.error('Start production error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors du démarrage' })
    }
  },
  
  async completeProduction(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const showcaseItem = await productionOrderService.completeProduction(id)
      res.json({ success: true, data: showcaseItem, message: 'Production terminée avec succès' })
    } catch (error: any) {
      console.error('Complete production error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la finalisation' })
    }
  },
  
  async cancelProduction(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await productionOrderService.cancelProduction(id)
      res.json({ success: true, message: 'Production annulée avec succès' })
    } catch (error: any) {
      console.error('Cancel production error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de l\'annulation' })
    }
  },
  
  async deleteProductionOrder(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await productionOrderService.delete(id)
      res.json({ success: true, message: 'Ordre de production supprimé avec succès' })
    } catch (error: any) {
      console.error('Delete production order error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },
  
  // ============================================
  // SHOWCASE ITEMS
  // ============================================
  
  async getShowcaseItems(req: Request, res: Response) {
    try {
      const showcaseId = getQueryString(req.query.showcaseId)
      const items = showcaseId
        ? await showcaseItemService.getByShowcase(showcaseId)
        : await showcaseItemService.getAvailable()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get showcase items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getAvailableItems(req: Request, res: Response) {
    try {
      const showcaseId = getQueryString(req.query.showcaseId)
      const items = showcaseId
        ? await showcaseItemService.getAvailable(showcaseId)
        : await showcaseItemService.getAvailable()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get available items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getExpiringItems(req: Request, res: Response) {
    try {
      let hours = 4
      const hoursParam = req.query.hours
      if (typeof hoursParam === 'string') {
        hours = parseInt(hoursParam) || 4
      } else if (typeof hoursParam === 'number') {
        hours = hoursParam
      }
      const items = await showcaseItemService.getExpiringSoon(hours)
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get expiring items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getLowStockItems(req: Request, res: Response) {
    try {
      const items = await showcaseItemService.getLowStock()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get low stock items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getShowcaseItemById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const item = await showcaseItemService.getById(id)
      if (!item) {
        return res.status(404).json({ success: false, error: 'Produit en vitrine non trouvé' })
      }
      res.json({ success: true, data: item })
    } catch (error) {
      console.error('Get showcase item by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async updateShowcaseItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await showcaseItemService.update(id, req.body)
      res.json({ success: true, message: 'Produit mis à jour avec succès' })
    } catch (error: any) {
      console.error('Update showcase item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' })
    }
  },
  
  async transferShowcaseItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      const { targetShowcaseId, quantity } = req.body
      
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      if (!targetShowcaseId) {
        return res.status(400).json({ success: false, error: 'targetShowcaseId requis' })
      }
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'Quantité valide requise' })
      }
      
      await showcaseItemService.transfer(id, targetShowcaseId, quantity)
      res.json({ success: true, message: 'Produit transféré avec succès' })
    } catch (error: any) {
      console.error('Transfer showcase item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors du transfert' })
    }
  },
  
  async deleteShowcaseItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await showcaseItemService.delete(id)
      res.json({ success: true, message: 'Produit supprimé avec succès' })
    } catch (error: any) {
      console.error('Delete showcase item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },
  
  // ============================================
  // SALES HELPERS
  // ============================================
  
  async checkAvailability(req: Request, res: Response) {
    try {
      const recipeId = getQueryString(req.query.recipeId)
      if (!recipeId) {
        return res.status(400).json({ success: false, error: 'recipeId requis' })
      }
      let qty = 1
      const quantityParam = req.query.quantity
      if (typeof quantityParam === 'string') {
        qty = parseInt(quantityParam) || 1
      } else if (typeof quantityParam === 'number') {
        qty = quantityParam
      }
      const result = await showcaseItemService.checkAvailability(recipeId, qty)
      res.json({ success: true, data: result })
    } catch (error: any) {
      console.error('Check availability error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la vérification' })
    }
  },
  
  async getAvailableRecipes(req: Request, res: Response) {
    try {
      const recipes = await showcaseItemService.getAvailableRecipes()
      res.json({ success: true, data: recipes })
    } catch (error) {
      console.error('Get available recipes error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async decrementStock(req: Request, res: Response) {
    try {
      const { recipeId, quantity } = req.body
      if (!recipeId) {
        return res.status(400).json({ success: false, error: 'recipeId requis' })
      }
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'Quantité valide requise' })
      }
      const success = await showcaseItemService.decrementStock(recipeId, quantity)
      if (!success) {
        return res.status(400).json({ success: false, error: 'Stock insuffisant' })
      }
      res.json({ success: true, message: 'Stock décrémenté avec succès' })
    } catch (error: any) {
      console.error('Decrement stock error:', error)
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la décrémentation' })
    }
  },
  
  // ============================================
  // STATS
  // ============================================
  
  async getProductionStats(req: Request, res: Response) {
    try {
      const stats = await productionStatsService.getStats()
      res.json({ success: true, data: stats })
    } catch (error) {
      console.error('Get production stats error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération des statistiques' })
    }
  }
}