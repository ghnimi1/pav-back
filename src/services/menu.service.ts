import { MenuCategoryModel } from '../models/MenuCategory.model'
import { MenuItemModel } from '../models/MenuItem.model'
import { SupplementModel } from '../models/Supplement.model'
import { OfferModel } from '../models/Offer.model'
import { BreakfastCategoryModel } from '../models/BreakfastCategory.model'
import { BreakfastItemModel } from '../models/BreakfastItem.model'
import { BreakfastFormulaModel } from '../models/BreakfastFormula.model'
import type { MenuCategory, CreateMenuCategoryInput } from '../models/MenuCategory.model'
import type { MenuItem, CreateMenuItemInput } from '../models/MenuItem.model'
import type { Supplement, CreateSupplementInput } from '../models/Supplement.model'
import type { Offer, CreateOfferInput } from '../models/Offer.model'
import type { BreakfastCategory, CreateBreakfastCategoryInput } from '../models/BreakfastCategory.model'
import type { BreakfastItem, CreateBreakfastItemInput } from '../models/BreakfastItem.model'
import type { BreakfastFormula } from '../models/BreakfastFormula.model'
import { SupplementCategoryModel, type CreateSupplementCategoryInput, type SupplementCategory } from '../models/SupplementCategory.model'

// ============================================
// MENU CATEGORY SERVICE
// ============================================

export class MenuCategoryService {
  async getAllCategories(): Promise<MenuCategory[]> {
    return MenuCategoryModel.findAll()
  }
  
  async getActiveCategories(): Promise<MenuCategory[]> {
    return MenuCategoryModel.findActive()
  }
  
  async getCategoryById(id: string): Promise<MenuCategory | null> {
    return MenuCategoryModel.findById(id)
  }
  
  async createCategory(data: CreateMenuCategoryInput): Promise<MenuCategory> {
    const existing = await MenuCategoryModel.findBySlug(data.slug || this.generateSlug(data.name))
    if (existing) {
      throw new Error('Une catégorie avec ce nom existe déjà')
    }
    return MenuCategoryModel.create(data)
  }
  
  async updateCategory(id: string, data: Partial<MenuCategory>): Promise<void> {
    const category = await MenuCategoryModel.findById(id)
    if (!category) {
      throw new Error('Catégorie non trouvée')
    }
    await MenuCategoryModel.update(id, data)
  }
  
  async deleteCategory(id: string): Promise<void> {
    const category = await MenuCategoryModel.findById(id)
    if (!category) {
      throw new Error('Catégorie non trouvée')
    }
    
    const items = await MenuItemModel.findByCategory(id)
    if (items.length > 0) {
      throw new Error(`Impossible de supprimer: ${items.length} article(s) utilisent cette catégorie`)
    }
    
    await MenuCategoryModel.delete(id)
  }
  
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

// ============================================
// MENU ITEM SERVICE
// ============================================

export class MenuItemService {
  async getAllItems(): Promise<MenuItem[]> {
    return MenuItemModel.findAll()
  }
  
  async getActiveItems(): Promise<MenuItem[]> {
    return MenuItemModel.findActive()
  }
  
  async getItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return MenuItemModel.findByCategory(categoryId)
  }
  
  async getItemById(id: string): Promise<MenuItem | null> {
    return MenuItemModel.findById(id)
  }
  
  async createItem(data: CreateMenuItemInput): Promise<MenuItem> {
    const category = await MenuCategoryModel.findById(data.categoryId)
    if (!category) {
      throw new Error('Catégorie non trouvée')
    }
    return MenuItemModel.create(data)
  }
  
  async updateItem(id: string, data: Partial<MenuItem>): Promise<void> {
    const item = await MenuItemModel.findById(id)
    if (!item) {
      throw new Error('Article non trouvé')
    }
    await MenuItemModel.update(id, data)
  }
  
  async deleteItem(id: string): Promise<void> {
    const item = await MenuItemModel.findById(id)
    if (!item) {
      throw new Error('Article non trouvé')
    }
    await MenuItemModel.delete(id)
  }
  
  async toggleAvailability(id: string): Promise<void> {
    const item = await MenuItemModel.findById(id)
    if (!item) {
      throw new Error('Article non trouvé')
    }
    await MenuItemModel.toggleAvailability(id)
  }
}

// ============================================
// SUPPLEMENT SERVICE
// ============================================
export class SupplementCategoryService {
  async getAllCategories(): Promise<SupplementCategory[]> {
    return SupplementCategoryModel.findAll()
  }
  
  async getActiveCategories(): Promise<SupplementCategory[]> {
    return SupplementCategoryModel.findActive()
  }
  
  async getCategoryById(id: string): Promise<SupplementCategory | null> {
    return SupplementCategoryModel.findById(id)
  }
  
  async createCategory(data: CreateSupplementCategoryInput): Promise<SupplementCategory> {
    const existing = (await SupplementCategoryModel.findAll()).find(c => c.name === data.name)
    if (existing) {
      throw new Error('Une catégorie avec ce nom existe déjà')
    }
    return SupplementCategoryModel.create(data)
  }
  
  async updateCategory(id: string, data: Partial<SupplementCategory>): Promise<void> {
    const category = await SupplementCategoryModel.findById(id)
    if (!category) {
      throw new Error('Catégorie non trouvée')
    }
    await SupplementCategoryModel.update(id, data)
  }
  
  async deleteCategory(id: string): Promise<void> {
    const category = await SupplementCategoryModel.findById(id)
    if (!category) {
      throw new Error('Catégorie non trouvée')
    }
    
    const supplementsCount = await SupplementCategoryModel.getSupplementsCount(id)
    if (supplementsCount > 0) {
      throw new Error(`Impossible de supprimer: ${supplementsCount} supplément(s) utilisent cette catégorie`)
    }
    
    await SupplementCategoryModel.delete(id)
  }
}

export const supplementCategoryService = new SupplementCategoryService()
export class SupplementService {
  async getAllSupplements(): Promise<Supplement[]> {
    return SupplementModel.findAll()
  }
  
  async getActiveSupplements(): Promise<Supplement[]> {
    return SupplementModel.findActive()
  }
  
  async getSupplementById(id: string): Promise<Supplement | null> {
    return SupplementModel.findById(id)
  }
  
  async createSupplement(data: CreateSupplementInput): Promise<Supplement> {
    return SupplementModel.create(data)
  }
  
  async updateSupplement(id: string, data: Partial<Supplement>): Promise<void> {
    const supplement = await SupplementModel.findById(id)
    if (!supplement) {
      throw new Error('Supplement non trouvé')
    }
    await SupplementModel.update(id, data)
  }
  
  async deleteSupplement(id: string): Promise<void> {
  const supplement = await SupplementModel.findById(id)
  if (!supplement) {
    throw new Error('Supplement non trouvé')
  }
  
  const db = (await import('../config/database')).getDB()
  // Fix: search for supplementId in availableSupplements array
  const itemsWithSupplement = await db.collection('menu_items')
    .find({ 'availableSupplements.supplementId': id })
    .toArray()
  
  const breakfastItemsWithSupplement = await db.collection('breakfast_items')
    .find({ 'availableSupplements.supplementId': id })
    .toArray()
  
  if (itemsWithSupplement.length > 0 || breakfastItemsWithSupplement.length > 0) {
    throw new Error(`Impossible de supprimer: ${itemsWithSupplement.length + breakfastItemsWithSupplement.length} article(s) utilisent ce supplement`)
  }
  
  await SupplementModel.delete(id)
}
}

// ============================================
// OFFER SERVICE
// ============================================

export class OfferService {
  async getAllOffers(): Promise<Offer[]> {
    return OfferModel.findAll()
  }
  
  async getActiveOffers(): Promise<Offer[]> {
    return OfferModel.findActive()
  }
  
  async getCurrentOffers(): Promise<Offer[]> {
    return OfferModel.findCurrent()
  }
  
  async getOfferById(id: string): Promise<Offer | null> {
    return OfferModel.findById(id)
  }
  
  async createOffer(data: CreateOfferInput): Promise<Offer> {
    return OfferModel.create(data)
  }
  
  async updateOffer(id: string, data: Partial<Offer>): Promise<void> {
    const offer = await OfferModel.findById(id)
    if (!offer) {
      throw new Error('Offre non trouvée')
    }
    await OfferModel.update(id, data)
  }
  
  async deleteOffer(id: string): Promise<void> {
    const offer = await OfferModel.findById(id)
    if (!offer) {
      throw new Error('Offre non trouvée')
    }
    await OfferModel.delete(id)
  }
}

// ============================================
// BREAKFAST CATEGORY SERVICE
// ============================================

export class BreakfastCategoryService {
  async getAllCategories(): Promise<BreakfastCategory[]> {
    return BreakfastCategoryModel.findAll()
  }

  async getActiveCategories(): Promise<BreakfastCategory[]> {
    return BreakfastCategoryModel.findActive()
  }

  async getCategoryById(id: string): Promise<BreakfastCategory | null> {
    return BreakfastCategoryModel.findById(id)
  }

  async createCategory(data: CreateBreakfastCategoryInput): Promise<BreakfastCategory> {
    return BreakfastCategoryModel.create(data)
  }

  async updateCategory(id: string, data: Partial<BreakfastCategory>): Promise<void> {
    const category = await BreakfastCategoryModel.findById(id)
    if (!category) {
      throw new Error('CatÃ©gorie petit dÃ©jeuner non trouvÃ©e')
    }
    await BreakfastCategoryModel.update(id, data)
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await BreakfastCategoryModel.findById(id)
    if (!category) {
      throw new Error('CatÃ©gorie petit dÃ©jeuner non trouvÃ©e')
    }

    const items = await BreakfastItemModel.findByCategory(id)
    if (items.length > 0) {
      throw new Error(`Impossible de supprimer: ${items.length} article(s) utilisent cette catÃ©gorie`)
    }

    await BreakfastCategoryModel.delete(id)
  }
}

// ============================================
// BREAKFAST ITEM SERVICE
// ============================================

export class BreakfastItemService {
  async getAllItems(): Promise<BreakfastItem[]> {
    return BreakfastItemModel.findAll()
  }

  async getActiveItems(): Promise<BreakfastItem[]> {
    return BreakfastItemModel.findActive()
  }

  async getItemsByCategory(categoryId: string): Promise<BreakfastItem[]> {
    return BreakfastItemModel.findByCategory(categoryId)
  }

  async getItemById(id: string): Promise<BreakfastItem | null> {
    return BreakfastItemModel.findById(id)
  }

  async createItem(data: CreateBreakfastItemInput): Promise<BreakfastItem> {
    const category = await BreakfastCategoryModel.findById(data.categoryId as string)
    if (!category) {
      throw new Error('Catégorie petit déjeuner non trouvée')
    }
    return BreakfastItemModel.create(data)
  }

  async updateItem(id: string, data: Partial<BreakfastItem>): Promise<void> {
    const item = await BreakfastItemModel.findById(id)
    if (!item) {
      throw new Error('Article petit déjeuner non trouvé')
    }
    
    const { _id, id: _, ...cleanData } = data as any
    await BreakfastItemModel.update(id, cleanData)
  }

  async deleteItem(id: string): Promise<void> {
    const item = await BreakfastItemModel.findById(id)
    if (!item) {
      throw new Error('Article petit déjeuner non trouvé')
    }
    await BreakfastItemModel.delete(id)
  }
}

// ============================================
// BREAKFAST FORMULA SERVICE
// ============================================

export class BreakfastFormulaService {
  async getAllFormulas(): Promise<BreakfastFormula[]> {
    return BreakfastFormulaModel.findAll()
  }

  async getActiveFormulas(): Promise<BreakfastFormula[]> {
    return BreakfastFormulaModel.findActive()
  }

  async getFormulaById(id: string): Promise<BreakfastFormula | null> {
    return BreakfastFormulaModel.findById(id)
  }

  async createFormula(data: Omit<BreakfastFormula, '_id' | 'createdAt' | 'updatedAt'>): Promise<BreakfastFormula> {
    const existing = await BreakfastFormulaModel.findByType(data.type)
    if (existing) {
      throw new Error('Une formule de ce type existe dÃ©jÃ ')
    }
    return BreakfastFormulaModel.create(data)
  }

  async updateFormula(id: string, data: Partial<BreakfastFormula>): Promise<void> {
    const formula = await BreakfastFormulaModel.findById(id)
    if (!formula) {
      throw new Error('Formule petit dÃ©jeuner non trouvÃ©e')
    }
    await BreakfastFormulaModel.update(id, data)
  }
}

// ============================================
// EXPORT SINGLETONS
// ============================================

export const menuCategoryService = new MenuCategoryService()
export const menuItemService = new MenuItemService()
export const supplementService = new SupplementService()
export const offerService = new OfferService()
export const breakfastCategoryService = new BreakfastCategoryService()
export const breakfastItemService = new BreakfastItemService()
export const breakfastFormulaService = new BreakfastFormulaService()
