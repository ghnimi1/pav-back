import type { Request, Response } from 'express'
import { 
  menuCategoryService, 
  menuItemService, 
  supplementService, 
  offerService,
  breakfastCategoryService,
  breakfastItemService,
  breakfastFormulaService,
} from '../services/menu.service'
import { getDB } from '../config/database'

// Helper function to get string from params
function getParamString(param: string | string[] | undefined): string | undefined {
  if (!param) return undefined
  if (Array.isArray(param)) return param[0]
  return param
}

export const MenuController = {
  // ============================================
  // CATEGORIES
  // ============================================
  
  async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await menuCategoryService.getAllCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get all categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getActiveCategories(req: Request, res: Response) {
    try {
      const categories = await menuCategoryService.getActiveCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get active categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getCategoryById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const category = await menuCategoryService.getCategoryById(id)
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
      const category = await menuCategoryService.createCategory(req.body)
      res.status(201).json({ success: true, data: category, message: 'Catégorie créée avec succès' })
    } catch (error: any) {
      console.error('Create category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la création' })
    }
  },
  
  async updateCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await menuCategoryService.updateCategory(id, req.body)
      res.json({ success: true, message: 'Catégorie mise à jour avec succès' })
    } catch (error: any) {
      console.error('Update category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' })
    }
  },
  
  async deleteCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await menuCategoryService.deleteCategory(id)
      res.json({ success: true, message: 'Catégorie supprimée avec succès' })
    } catch (error: any) {
      console.error('Delete category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },
  
  // ============================================
  // MENU ITEMS
  // ============================================
  
  async getAllItems(req: Request, res: Response) {
    try {
      const items = await menuItemService.getAllItems()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get all items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getActiveItems(req: Request, res: Response) {
    try {
      const items = await menuItemService.getActiveItems()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get active items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getItemsByCategory(req: Request, res: Response) {
    try {
      const categoryId = getParamString(req.params.categoryId)
      if (!categoryId) {
        return res.status(400).json({ success: false, error: 'categoryId requis' })
      }
      const items = await menuItemService.getItemsByCategory(categoryId)
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get items by category error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getItemById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const item = await menuItemService.getItemById(id)
      if (!item) {
        return res.status(404).json({ success: false, error: 'Article non trouvé' })
      }
      res.json({ success: true, data: item })
    } catch (error) {
      console.error('Get item by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createItem(req: Request, res: Response) {
    try {
      const item = await menuItemService.createItem(req.body)
      res.status(201).json({ success: true, data: item, message: 'Article créé avec succès' })
    } catch (error: any) {
      console.error('Create item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la création' })
    }
  },
  
  async updateItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await menuItemService.updateItem(id, req.body)
      res.json({ success: true, message: 'Article mis à jour avec succès' })
    } catch (error: any) {
      console.error('Update item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' })
    }
  },
  
  async deleteItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await menuItemService.deleteItem(id)
      res.json({ success: true, message: 'Article supprimé avec succès' })
    } catch (error: any) {
      console.error('Delete item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },
  
  async toggleAvailability(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await menuItemService.toggleAvailability(id)
      res.json({ success: true, message: 'Disponibilité modifiée avec succès' })
    } catch (error: any) {
      console.error('Toggle availability error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la modification' })
    }
  },
  
  // ============================================
  // SUPPLEMENTS
  // ============================================
  
  async getAllSupplements(req: Request, res: Response) {
    try {
      const supplements = await supplementService.getAllSupplements()
      res.json({ success: true, data: supplements })
    } catch (error) {
      console.error('Get all supplements error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getActiveSupplements(req: Request, res: Response) {
    try {
      const supplements = await supplementService.getActiveSupplements()
      res.json({ success: true, data: supplements })
    } catch (error) {
      console.error('Get active supplements error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getSupplementById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const supplement = await supplementService.getSupplementById(id)
      if (!supplement) {
        return res.status(404).json({ success: false, error: 'Supplement non trouvé' })
      }
      res.json({ success: true, data: supplement })
    } catch (error) {
      console.error('Get supplement by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createSupplement(req: Request, res: Response) {
    try {
      const supplement = await supplementService.createSupplement(req.body)
      res.status(201).json({ success: true, data: supplement, message: 'Supplement créé avec succès' })
    } catch (error: any) {
      console.error('Create supplement error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la création' })
    }
  },
  
  async updateSupplement(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await supplementService.updateSupplement(id, req.body)
      res.json({ success: true, message: 'Supplement mis à jour avec succès' })
    } catch (error: any) {
      console.error('Update supplement error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' })
    }
  },
  
  async deleteSupplement(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await supplementService.deleteSupplement(id)
      res.json({ success: true, message: 'Supplement supprimé avec succès' })
    } catch (error: any) {
      console.error('Delete supplement error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },
  
  // ============================================
  // OFFERS
  // ============================================
  
  async getAllOffers(req: Request, res: Response) {
    try {
      const offers = await offerService.getAllOffers()
      res.json({ success: true, data: offers })
    } catch (error) {
      console.error('Get all offers error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getActiveOffers(req: Request, res: Response) {
    try {
      const offers = await offerService.getActiveOffers()
      res.json({ success: true, data: offers })
    } catch (error) {
      console.error('Get active offers error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getCurrentOffers(req: Request, res: Response) {
    try {
      const offers = await offerService.getCurrentOffers()
      res.json({ success: true, data: offers })
    } catch (error) {
      console.error('Get current offers error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async getOfferById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      const offer = await offerService.getOfferById(id)
      if (!offer) {
        return res.status(404).json({ success: false, error: 'Offre non trouvée' })
      }
      res.json({ success: true, data: offer })
    } catch (error) {
      console.error('Get offer by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' })
    }
  },
  
  async createOffer(req: Request, res: Response) {
    try {
      const offer = await offerService.createOffer(req.body)
      res.status(201).json({ success: true, data: offer, message: 'Offre créée avec succès' })
    } catch (error: any) {
      console.error('Create offer error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la création' })
    }
  },
  
  async updateOffer(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await offerService.updateOffer(id, req.body)
      res.json({ success: true, message: 'Offre mise à jour avec succès' })
    } catch (error: any) {
      console.error('Update offer error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' })
    }
  },
  
  async deleteOffer(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await offerService.deleteOffer(id)
      res.json({ success: true, message: 'Offre supprimée avec succès' })
    } catch (error: any) {
      console.error('Delete offer error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },

  // ============================================
  // BREAKFAST CATEGORIES
  // ============================================

  async getAllBreakfastCategories(req: Request, res: Response) {
    try {
      const categories = await breakfastCategoryService.getAllCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get all breakfast categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la rÃ©cupÃ©ration' })
    }
  },

  async getActiveBreakfastCategories(req: Request, res: Response) {
    try {
      const categories = await breakfastCategoryService.getActiveCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get active breakfast categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la rÃ©cupÃ©ration' })
    }
  },

  async createBreakfastCategory(req: Request, res: Response) {
    try {
      const category = await breakfastCategoryService.createCategory(req.body)
      res.status(201).json({ success: true, data: category, message: 'CatÃ©gorie petit dÃ©jeuner crÃ©Ã©e avec succÃ¨s' })
    } catch (error: any) {
      console.error('Create breakfast category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la crÃ©ation' })
    }
  },

  async updateBreakfastCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await breakfastCategoryService.updateCategory(id, req.body)
      res.json({ success: true, message: 'CatÃ©gorie petit dÃ©jeuner mise Ã  jour avec succÃ¨s' })
    } catch (error: any) {
      console.error('Update breakfast category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise Ã  jour' })
    }
  },

  async deleteBreakfastCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await breakfastCategoryService.deleteCategory(id)
      res.json({ success: true, message: 'CatÃ©gorie petit dÃ©jeuner supprimÃ©e avec succÃ¨s' })
    } catch (error: any) {
      console.error('Delete breakfast category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },

  // ============================================
  // BREAKFAST ITEMS
  // ============================================

  async getAllBreakfastItems(req: Request, res: Response) {
    try {
      const items = await breakfastItemService.getAllItems()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get all breakfast items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la rÃ©cupÃ©ration' })
    }
  },

  async getActiveBreakfastItems(req: Request, res: Response) {
    try {
      const items = await breakfastItemService.getActiveItems()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get active breakfast items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la rÃ©cupÃ©ration' })
    }
  },

  async getBreakfastItemsByCategory(req: Request, res: Response) {
    try {
      const categoryId = getParamString(req.params.categoryId)
      if (!categoryId) {
        return res.status(400).json({ success: false, error: 'categoryId requis' })
      }
      const items = await breakfastItemService.getItemsByCategory(categoryId)
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get breakfast items by category error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la rÃ©cupÃ©ration' })
    }
  },

  async createBreakfastItem(req: Request, res: Response) {
    try {
      const item = await breakfastItemService.createItem(req.body)
      res.status(201).json({ success: true, data: item, message: 'Article petit dÃ©jeuner crÃ©Ã© avec succÃ¨s' })
    } catch (error: any) {
      console.error('Create breakfast item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la crÃ©ation' })
    }
  },

  async updateBreakfastItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await breakfastItemService.updateItem(id, req.body)
      res.json({ success: true, message: 'Article petit dÃ©jeuner mis Ã  jour avec succÃ¨s' })
    } catch (error: any) {
      console.error('Update breakfast item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise Ã  jour' })
    }
  },

  async deleteBreakfastItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await breakfastItemService.deleteItem(id)
      res.json({ success: true, message: 'Article petit dÃ©jeuner supprimÃ© avec succÃ¨s' })
    } catch (error: any) {
      console.error('Delete breakfast item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },

  // ============================================
  // BREAKFAST FORMULAS
  // ============================================

  async getAllBreakfastFormulas(req: Request, res: Response) {
    try {
      const formulas = await breakfastFormulaService.getAllFormulas()
      res.json({ success: true, data: formulas })
    } catch (error) {
      console.error('Get all breakfast formulas error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la rÃ©cupÃ©ration' })
    }
  },

  async getActiveBreakfastFormulas(req: Request, res: Response) {
    try {
      const formulas = await breakfastFormulaService.getActiveFormulas()
      res.json({ success: true, data: formulas })
    } catch (error) {
      console.error('Get active breakfast formulas error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la rÃ©cupÃ©ration' })
    }
  },

  async createBreakfastFormula(req: Request, res: Response) {
    try {
      const formula = await breakfastFormulaService.createFormula(req.body)
      res.status(201).json({ success: true, data: formula, message: 'Formule petit dÃ©jeuner crÃ©Ã©e avec succÃ¨s' })
    } catch (error: any) {
      console.error('Create breakfast formula error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la crÃ©ation' })
    }
  },

  async updateBreakfastFormula(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }
      await breakfastFormulaService.updateFormula(id, req.body)
      res.json({ success: true, message: 'Formule petit dÃ©jeuner mise Ã  jour avec succÃ¨s' })
    } catch (error: any) {
      console.error('Update breakfast formula error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise Ã  jour' })
    }
  }
}
