import fs from 'node:fs/promises'
import type { Request, Response } from 'express'
import {
  breakfastCategoryService,
  breakfastFormulaService,
  breakfastItemService,
  menuCategoryService,
  menuItemService,
  offerService,
  supplementService,
} from '../services/menu.service'
import { getLocalUploadAbsolutePath, getUploadedImagePath } from '../middleware/upload.middleware'

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

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value as T
}

function parseMenuItemPayload(req: Request) {
  const body = req.body as Record<string, unknown>
  const imageFromUpload = getUploadedImagePath(req.file)
  const removeImage = parseBoolean(body.removeImage) === true

  return {
    name: typeof body.name === 'string' ? body.name : undefined,
    description: typeof body.description === 'string' ? body.description : undefined,
    price: parseNumber(body.price),
    points: parseNumber(body.points),
    categoryId: typeof body.categoryId === 'string' ? body.categoryId : undefined,
    image: removeImage ? undefined : imageFromUpload || (typeof body.image === 'string' && body.image.trim() ? body.image : undefined),
    allergens: parseJsonField<string[]>(body.allergens, []),
    isAvailable: parseBoolean(body.isAvailable),
    tags: parseJsonField<string[] | undefined>(body.tags, undefined),
    supplements: parseJsonField(body.supplements, undefined),
    promotion: parseJsonField(body.promotion, undefined),
    recipeId: typeof body.recipeId === 'string' && body.recipeId.trim() ? body.recipeId : undefined,
  }
}

function parseBreakfastItemPayload(req: Request) {
  const body = req.body as Record<string, unknown>
  const imageFromUpload = getUploadedImagePath(req.file)
  const removeImage = parseBoolean(body.removeImage) === true

  return {
    name: typeof body.name === 'string' ? body.name : undefined,
    description: typeof body.description === 'string' ? body.description : undefined,
    price: parseNumber(body.price),
    points: parseNumber(body.points),
    categoryId: typeof body.categoryId === 'string' ? body.categoryId : undefined,
    image: removeImage ? undefined : imageFromUpload || (typeof body.image === 'string' && body.image.trim() ? body.image : undefined),
    isAvailable: parseBoolean(body.isAvailable),
    isRequired: parseBoolean(body.isRequired),
    minQuantity: parseNumber(body.minQuantity),
    maxQuantity: parseNumber(body.maxQuantity),
    availableSupplements: parseJsonField(body.availableSupplements, undefined),
  }
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

export const MenuController = {
  async getAllCategories(_req: Request, res: Response) {
    try {
      const categories = await menuCategoryService.getAllCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get all categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async getActiveCategories(_req: Request, res: Response) {
    try {
      const categories = await menuCategoryService.getActiveCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get active categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
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
        return res.status(404).json({ success: false, error: 'Categorie non trouvee' })
      }

      res.json({ success: true, data: category })
    } catch (error) {
      console.error('Get category by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async createCategory(req: Request, res: Response) {
    try {
      const category = await menuCategoryService.createCategory(req.body)
      res.status(201).json({ success: true, data: category, message: 'Categorie creee avec succes' })
    } catch (error: any) {
      console.error('Create category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la creation' })
    }
  },

  async updateCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await menuCategoryService.updateCategory(id, req.body)
      res.json({ success: true, message: 'Categorie mise a jour avec succes' })
    } catch (error: any) {
      console.error('Update category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour' })
    }
  },

  async deleteCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await menuCategoryService.deleteCategory(id)
      res.json({ success: true, message: 'Categorie supprimee avec succes' })
    } catch (error: any) {
      console.error('Delete category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },

  async getAllItems(_req: Request, res: Response) {
    try {
      const items = await menuItemService.getAllItems()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get all items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async getActiveItems(_req: Request, res: Response) {
    try {
      const items = await menuItemService.getActiveItems()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get active items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
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
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
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
        return res.status(404).json({ success: false, error: 'Article non trouve' })
      }

      res.json({ success: true, data: item })
    } catch (error) {
      console.error('Get item by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async createItem(req: Request, res: Response) {
    try {
      const item = await menuItemService.createItem(parseMenuItemPayload(req))
      res.status(201).json({ success: true, data: item, message: 'Article cree avec succes' })
    } catch (error: any) {
      console.error('Create item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la creation' })
    }
  },

  async updateItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      const currentItem = await menuItemService.getItemById(id)
      if (!currentItem) {
        return res.status(404).json({ success: false, error: 'Article non trouve' })
      }

      const payload = parseMenuItemPayload(req)
      await menuItemService.updateItem(id, payload)

      if ((req.file || parseBoolean((req.body as Record<string, unknown>).removeImage) === true) && currentItem.image !== payload.image) {
        await removeLocalImageIfNeeded(currentItem.image)
      }

      res.json({ success: true, message: 'Article mis a jour avec succes' })
    } catch (error: any) {
      console.error('Update item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour' })
    }
  },

  async deleteItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      const currentItem = await menuItemService.getItemById(id)
      await menuItemService.deleteItem(id)
      await removeLocalImageIfNeeded(currentItem?.image)

      res.json({ success: true, message: 'Article supprime avec succes' })
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
      res.json({ success: true, message: 'Disponibilite modifiee avec succes' })
    } catch (error: any) {
      console.error('Toggle availability error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la modification' })
    }
  },

  async getAllSupplements(_req: Request, res: Response) {
    try {
      const supplements = await supplementService.getAllSupplements()
      res.json({ success: true, data: supplements })
    } catch (error) {
      console.error('Get all supplements error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async getActiveSupplements(_req: Request, res: Response) {
    try {
      const supplements = await supplementService.getActiveSupplements()
      res.json({ success: true, data: supplements })
    } catch (error) {
      console.error('Get active supplements error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
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
        return res.status(404).json({ success: false, error: 'Supplement non trouve' })
      }

      res.json({ success: true, data: supplement })
    } catch (error) {
      console.error('Get supplement by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async createSupplement(req: Request, res: Response) {
    try {
      const supplement = await supplementService.createSupplement(req.body)
      res.status(201).json({ success: true, data: supplement, message: 'Supplement cree avec succes' })
    } catch (error: any) {
      console.error('Create supplement error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la creation' })
    }
  },

  async updateSupplement(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await supplementService.updateSupplement(id, req.body)
      res.json({ success: true, message: 'Supplement mis a jour avec succes' })
    } catch (error: any) {
      console.error('Update supplement error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour' })
    }
  },

  async deleteSupplement(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await supplementService.deleteSupplement(id)
      res.json({ success: true, message: 'Supplement supprime avec succes' })
    } catch (error: any) {
      console.error('Delete supplement error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },

  async getAllOffers(_req: Request, res: Response) {
    try {
      const offers = await offerService.getAllOffers()
      res.json({ success: true, data: offers })
    } catch (error) {
      console.error('Get all offers error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async getActiveOffers(_req: Request, res: Response) {
    try {
      const offers = await offerService.getActiveOffers()
      res.json({ success: true, data: offers })
    } catch (error) {
      console.error('Get active offers error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async getCurrentOffers(_req: Request, res: Response) {
    try {
      const offers = await offerService.getCurrentOffers()
      res.json({ success: true, data: offers })
    } catch (error) {
      console.error('Get current offers error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
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
        return res.status(404).json({ success: false, error: 'Offre non trouvee' })
      }

      res.json({ success: true, data: offer })
    } catch (error) {
      console.error('Get offer by id error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async createOffer(req: Request, res: Response) {
    try {
      const offer = await offerService.createOffer(req.body)
      res.status(201).json({ success: true, data: offer, message: 'Offre creee avec succes' })
    } catch (error: any) {
      console.error('Create offer error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la creation' })
    }
  },

  async updateOffer(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await offerService.updateOffer(id, req.body)
      res.json({ success: true, message: 'Offre mise a jour avec succes' })
    } catch (error: any) {
      console.error('Update offer error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour' })
    }
  },

  async deleteOffer(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await offerService.deleteOffer(id)
      res.json({ success: true, message: 'Offre supprimee avec succes' })
    } catch (error: any) {
      console.error('Delete offer error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },

  async getAllBreakfastCategories(_req: Request, res: Response) {
    try {
      const categories = await breakfastCategoryService.getAllCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get all breakfast categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async getActiveBreakfastCategories(_req: Request, res: Response) {
    try {
      const categories = await breakfastCategoryService.getActiveCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      console.error('Get active breakfast categories error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async createBreakfastCategory(req: Request, res: Response) {
    try {
      const category = await breakfastCategoryService.createCategory(req.body)
      res.status(201).json({ success: true, data: category, message: 'Categorie petit dejeuner creee avec succes' })
    } catch (error: any) {
      console.error('Create breakfast category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la creation' })
    }
  },

  async updateBreakfastCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await breakfastCategoryService.updateCategory(id, req.body)
      res.json({ success: true, message: 'Categorie petit dejeuner mise a jour avec succes' })
    } catch (error: any) {
      console.error('Update breakfast category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour' })
    }
  },

  async deleteBreakfastCategory(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await breakfastCategoryService.deleteCategory(id)
      res.json({ success: true, message: 'Categorie petit dejeuner supprimee avec succes' })
    } catch (error: any) {
      console.error('Delete breakfast category error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },

  async getAllBreakfastItems(_req: Request, res: Response) {
    try {
      const items = await breakfastItemService.getAllItems()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get all breakfast items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async getActiveBreakfastItems(_req: Request, res: Response) {
    try {
      const items = await breakfastItemService.getActiveItems()
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Get active breakfast items error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
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
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async createBreakfastItem(req: Request, res: Response) {
    try {
      const item = await breakfastItemService.createItem(parseBreakfastItemPayload(req))
      res.status(201).json({ success: true, data: item, message: 'Article petit dejeuner cree avec succes' })
    } catch (error: any) {
      console.error('Create breakfast item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la creation' })
    }
  },

  async updateBreakfastItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      const currentItem = await breakfastItemService.getItemById(id)
      if (!currentItem) {
        return res.status(404).json({ success: false, error: 'Article petit dejeuner non trouve' })
      }

      const payload = parseBreakfastItemPayload(req)
      await breakfastItemService.updateItem(id, payload)

      if ((req.file || parseBoolean((req.body as Record<string, unknown>).removeImage) === true) && currentItem.image !== payload.image) {
        await removeLocalImageIfNeeded(currentItem.image)
      }

      res.json({ success: true, message: 'Article petit dejeuner mis a jour avec succes' })
    } catch (error: any) {
      console.error('Update breakfast item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour' })
    }
  },

  async deleteBreakfastItem(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      const currentItem = await breakfastItemService.getItemById(id)
      await breakfastItemService.deleteItem(id)
      await removeLocalImageIfNeeded(currentItem?.image)

      res.json({ success: true, message: 'Article petit dejeuner supprime avec succes' })
    } catch (error: any) {
      console.error('Delete breakfast item error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la suppression' })
    }
  },

  async getAllBreakfastFormulas(_req: Request, res: Response) {
    try {
      const formulas = await breakfastFormulaService.getAllFormulas()
      res.json({ success: true, data: formulas })
    } catch (error) {
      console.error('Get all breakfast formulas error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async getActiveBreakfastFormulas(_req: Request, res: Response) {
    try {
      const formulas = await breakfastFormulaService.getActiveFormulas()
      res.json({ success: true, data: formulas })
    } catch (error) {
      console.error('Get active breakfast formulas error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' })
    }
  },

  async createBreakfastFormula(req: Request, res: Response) {
    try {
      const formula = await breakfastFormulaService.createFormula(req.body)
      res.status(201).json({ success: true, data: formula, message: 'Formule petit dejeuner creee avec succes' })
    } catch (error: any) {
      console.error('Create breakfast formula error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la creation' })
    }
  },

  async updateBreakfastFormula(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await breakfastFormulaService.updateFormula(id, req.body)
      res.json({ success: true, message: 'Formule petit dejeuner mise a jour avec succes' })
    } catch (error: any) {
      console.error('Update breakfast formula error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour' })
    }
  },
}
