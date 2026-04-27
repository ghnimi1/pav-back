// backend/src/services/production.service.ts

import { RecipeModel } from '../models/Recipe.model'
import type { Recipe } from '../models/Recipe.model'
import { RecipeCategoryModel } from '../models/RecipeCategory.model'
import type { RecipeCategory } from '../models/RecipeCategory.model'
import { ShowcaseModel } from '../models/Showcase.model'
import type { Showcase } from '../models/Showcase.model'
import { ProductionOrderModel } from '../models/ProductionOrder.model'
import type { ProductionOrder, ProductionStatus } from '../models/ProductionOrder.model'
import { ShowcaseItemModel } from '../models/ShowcaseItem.model'
import type { ShowcaseItem } from '../models/ShowcaseItem.model'
import { getDB } from '../config/database'
import { ObjectId } from 'mongodb'

// Helper functions pour convertir les documents MongoDB
function toProductionOrder(doc: any): ProductionOrder | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    recipeId: doc.recipeId,
    showcaseId: doc.showcaseId,
    quantity: doc.quantity,
    scheduledDate: doc.scheduledDate,
    scheduledTime: doc.scheduledTime,
    status: doc.status,
    producedBy: doc.producedBy,
    startedAt: doc.startedAt,
    completedAt: doc.completedAt,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

function toShowcaseItem(doc: any): ShowcaseItem | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    recipeId: doc.recipeId,
    productionOrderId: doc.productionOrderId,
    showcaseId: doc.showcaseId,
    batchNumber: doc.batchNumber,
    quantity: doc.quantity,
    initialQuantity: doc.initialQuantity,
    productionDate: doc.productionDate,
    productionTime: doc.productionTime,
    expirationDate: doc.expirationDate,
    expirationTime: doc.expirationTime,
    unitCost: doc.unitCost,
    sellingPrice: doc.sellingPrice,
    status: doc.status || 'available',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

// ============================================
// RECIPE CATEGORY SERVICE
// ============================================

export class RecipeCategoryService {
  async getAll(): Promise<RecipeCategory[]> {
    return RecipeCategoryModel.findAll()
  }
  
  async getActive(): Promise<RecipeCategory[]> {
    return RecipeCategoryModel.findActive()
  }
  
  async getById(id: string): Promise<RecipeCategory | null> {
    return RecipeCategoryModel.findById(id)
  }
  
  async create(data: { name: string; icon?: string; color?: string; isActive?: boolean }): Promise<RecipeCategory> {
    return RecipeCategoryModel.create(data)
  }
  
  async update(id: string, data: Partial<RecipeCategory>): Promise<void> {
    const exists = await RecipeCategoryModel.findById(id)
    if (!exists) throw new Error('Catégorie non trouvée')
    await RecipeCategoryModel.update(id, data)
  }
  
  async delete(id: string): Promise<void> {
    const exists = await RecipeCategoryModel.findById(id)
    if (!exists) throw new Error('Catégorie non trouvée')
    
    const db = getDB()
    const recipeCount = await db.collection('recipes').countDocuments({ categoryId: id })
    if (recipeCount > 0) {
      throw new Error(`Impossible de supprimer: ${recipeCount} recette(s) utilisent cette catégorie`)
    }
    
    await RecipeCategoryModel.delete(id)
  }
}

// ============================================
// RECIPE SERVICE
// ============================================

export interface RecipeWithCost extends Recipe {
  costPerUnit: number
  margin: number
  totalIngredientCost: number
}

export class RecipeService {
  async getAll(): Promise<Recipe[]> {
    return RecipeModel.findAll()
  }
  
  async getActive(): Promise<Recipe[]> {
    return RecipeModel.findActive()
  }
  
  async getByCategory(categoryId: string): Promise<Recipe[]> {
    return RecipeModel.findByCategory(categoryId)
  }
  
  async getById(id: string): Promise<Recipe | null> {
    return RecipeModel.findById(id)
  }
  
  async getWithCost(id: string): Promise<RecipeWithCost | null> {
    const recipe = await RecipeModel.findById(id)
    if (!recipe) return null
    
    const costPerUnit = await RecipeModel.getRecipeCost(id)
    const totalIngredientCost = costPerUnit * recipe.yield
    const margin = recipe.sellingPrice > 0 
      ? ((recipe.sellingPrice - costPerUnit) / recipe.sellingPrice) * 100 
      : 0
    
    return {
      ...recipe,
      costPerUnit,
      margin,
      totalIngredientCost
    }
  }
  
  async create(data: {
    name: string
    description?: string
    categoryId: string
    ingredients: { productId: string; quantity: number; unit: string }[]
    yield: number
    yieldUnit?: string
    preparationTime?: number
    cookingTime?: number
    shelfLife?: number
    sellingPrice: number
    image?: string
    instructions?: string
    isActive?: boolean
  }): Promise<Recipe> {
    const category = await RecipeCategoryModel.findById(data.categoryId)
    if (!category) throw new Error('Catégorie non trouvée')
    
    const db = getDB()
    for (const ing of data.ingredients) {
      const product = await db.collection('products').findOne({ _id: new ObjectId(ing.productId) })
      if (!product) throw new Error(`Produit ${ing.productId} non trouvé`)
    }
    
    return RecipeModel.create(data)
  }
  
  async update(id: string, data: Partial<Recipe>): Promise<void> {
    const exists = await RecipeModel.findById(id)
    if (!exists) throw new Error('Recette non trouvée')
    await RecipeModel.update(id, data)
  }
  
  async delete(id: string): Promise<void> {
    const exists = await RecipeModel.findById(id)
    if (!exists) throw new Error('Recette non trouvée')
    
    const orders = await ProductionOrderModel.findByRecipe(id)
    if (orders.length > 0) {
      throw new Error(`Impossible de supprimer: ${orders.length} ordre(s) de production utilisent cette recette`)
    }
    
    const db = getDB()
    const itemCount = await db.collection('showcase_items').countDocuments({ recipeId: id })
    if (itemCount > 0) {
      throw new Error(`Impossible de supprimer: ${itemCount} produit(s) en vitrine utilisent cette recette`)
    }
    
    await RecipeModel.delete(id)
  }
  
  async checkIngredientAvailability(recipeId: string, quantity: number): Promise<{
    available: boolean
    missing: { productId: string; productName: string; needed: number; available: number }[]
  }> {
    const recipe = await RecipeModel.findById(recipeId)
    if (!recipe) throw new Error('Recette non trouvée')
    
    const missing: { productId: string; productName: string; needed: number; available: number }[] = []
    const db = getDB()
    
    for (const ing of recipe.ingredients) {
      const needed = ing.quantity * quantity
      const batches = await db.collection('batches')
        .find({ productId: ing.productId, quantity: { $gt: 0 } })
        .toArray()
      const available = batches.reduce((sum, b) => sum + b.quantity, 0)
      
      if (available < needed) {
        const product = await db.collection('products').findOne({ _id: new ObjectId(ing.productId) })
        missing.push({
          productId: ing.productId,
          productName: product?.name || 'Produit inconnu',
          needed,
          available
        })
      }
    }
    
    return { available: missing.length === 0, missing }
  }
  
  async consumeIngredients(recipeId: string, quantity: number): Promise<boolean> {
    const recipe = await RecipeModel.findById(recipeId)
    if (!recipe) return false
    
    const { available } = await this.checkIngredientAvailability(recipeId, quantity)
    if (!available) return false
    
    const db = getDB()
    for (const ing of recipe.ingredients) {
      const needed = ing.quantity * quantity
      let remaining = needed
      const batches = await db.collection('batches')
        .find({ productId: ing.productId, quantity: { $gt: 0 } })
        .sort({ receptionDate: 1 })
        .toArray()
      
      for (const batch of batches) {
        if (remaining <= 0) break
        const consume = Math.min(batch.quantity, remaining)
        const newQuantity = batch.quantity - consume
        await db.collection('batches').updateOne(
          { _id: batch._id },
          { $set: { quantity: newQuantity, updatedAt: new Date() } }
        )
        remaining -= consume
      }
      
      if (remaining > 0) return false
    }
    
    return true
  }
}

// ============================================
// SHOWCASE SERVICE
// ============================================

export class ShowcaseService {
  async getAll(): Promise<Showcase[]> {
    return ShowcaseModel.findAll()
  }
  
  async getActive(): Promise<Showcase[]> {
    return ShowcaseModel.findActive()
  }
  
  async getById(id: string): Promise<Showcase | null> {
    return ShowcaseModel.findById(id)
  }
  
  async create(data: {
    name: string
    type: Showcase['type']
    temperature?: string
    capacity?: number
    location: string
    isActive?: boolean
  }): Promise<Showcase> {
    return ShowcaseModel.create(data)
  }
  
  async update(id: string, data: Partial<Showcase>): Promise<void> {
    const exists = await ShowcaseModel.findById(id)
    if (!exists) throw new Error('Vitrine non trouvée')
    await ShowcaseModel.update(id, data)
  }
  
  async delete(id: string): Promise<void> {
    const exists = await ShowcaseModel.findById(id)
    if (!exists) throw new Error('Vitrine non trouvée')
    
    const items = await ShowcaseItemModel.findByShowcase(id)
    if (items.length > 0) {
      throw new Error(`Impossible de supprimer: ${items.length} produit(s) dans cette vitrine`)
    }
    
    await ShowcaseModel.delete(id)
  }
}

// ============================================
// PRODUCTION ORDER SERVICE
// ============================================

export class ProductionOrderService {
  async getAll(): Promise<ProductionOrder[]> {
    const db = getDB()
    const docs = await db.collection('production_orders').find({}).toArray()
    return docs.map(doc => toProductionOrder(doc)).filter(o => o !== null) as ProductionOrder[]
  }
  
  async getByStatus(status: ProductionStatus): Promise<ProductionOrder[]> {
    const db = getDB()
    const docs = await db.collection('production_orders')
      .find({ status })
      .toArray()
    return docs.map(doc => toProductionOrder(doc)).filter(o => o !== null) as ProductionOrder[]
  }
  
  async getToday(): Promise<ProductionOrder[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const db = getDB()
    const docs = await db.collection('production_orders')
      .find({ scheduledDate: { $gte: today, $lt: tomorrow } })
      .toArray()
    return docs.map(doc => toProductionOrder(doc)).filter(o => o !== null) as ProductionOrder[]
  }
  
  async getById(id: string): Promise<ProductionOrder | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('production_orders').findOne({ _id: new ObjectId(id) })
    return toProductionOrder(doc)
  }
  
  async create(data: {
    recipeId: string
    showcaseId: string
    quantity: number
    scheduledDate: Date | string
    scheduledTime?: string
    notes?: string
  }): Promise<ProductionOrder> {
    const recipe = await RecipeModel.findById(data.recipeId)
    if (!recipe) throw new Error('Recette non trouvée')
    
    const showcase = await ShowcaseModel.findById(data.showcaseId)
    if (!showcase) throw new Error('Vitrine non trouvée')
    
    const recipeService = new RecipeService()
    const { available, missing } = await recipeService.checkIngredientAvailability(data.recipeId, data.quantity)
    if (!available) {
      const missingNames = missing.map(m => `${m.productName}: ${m.needed.toFixed(2)} requis, ${m.available.toFixed(2)} dispo`).join(', ')
      throw new Error(`Ingredients insuffisants: ${missingNames}`)
    }
    
    return ProductionOrderModel.create({ ...data, status: 'planned' })
  }
  
  async update(id: string, data: Partial<ProductionOrder>): Promise<void> {
    const exists = await ProductionOrderModel.findById(id)
    if (!exists) throw new Error('Ordre de production non trouvé')
    await ProductionOrderModel.update(id, data)
  }
  
  async startProduction(id: string, employeeId: string): Promise<void> {
    const order = await ProductionOrderModel.findById(id)
    if (!order) throw new Error('Ordre de production non trouvé')
    if (order.status !== 'planned') throw new Error('Seules les commandes planifiées peuvent être démarrées')
    
    const recipeService = new RecipeService()
    const { available } = await recipeService.checkIngredientAvailability(order.recipeId, order.quantity)
    if (!available) throw new Error('Ingredients insuffisants pour démarrer la production')
    
    await recipeService.consumeIngredients(order.recipeId, order.quantity)
    await ProductionOrderModel.startProduction(id, employeeId)
  }
  
  async completeProduction(id: string): Promise<ShowcaseItem> {
    const order = await ProductionOrderModel.findById(id)
    if (!order) throw new Error('Ordre de production non trouvé')
    if (order.status !== 'in-progress') throw new Error('Seules les commandes en cours peuvent être terminées')
    
    const recipe = await RecipeModel.findById(order.recipeId)
    if (!recipe) throw new Error('Recette non trouvée')
    
    const now = new Date()
    const expirationDate = new Date(now.getTime() + recipe.shelfLife * 60 * 60 * 1000)
    const batchNumber = `PROD-${Date.now().toString().slice(-8)}`
    
    const showcaseItem = await ShowcaseItemModel.create({
      recipeId: order.recipeId,
      productionOrderId: id,
      showcaseId: order.showcaseId,
      batchNumber,
      quantity: recipe.yield * order.quantity,
      initialQuantity: recipe.yield * order.quantity,
      productionDate: now,
      productionTime: now.toTimeString().slice(0, 5),
      expirationDate,
      expirationTime: expirationDate.toTimeString().slice(0, 5),
      unitCost: await RecipeModel.getRecipeCost(order.recipeId),
      sellingPrice: recipe.sellingPrice
    })
    
    await ProductionOrderModel.completeProduction(id)
    return showcaseItem
  }
  
  async cancelProduction(id: string): Promise<void> {
    const order = await ProductionOrderModel.findById(id)
    if (!order) throw new Error('Ordre de production non trouvé')
    if (order.status === 'completed') throw new Error('Impossible d\'annuler une production terminée')
    await ProductionOrderModel.cancelProduction(id)
  }
  
  async delete(id: string): Promise<void> {
    const order = await ProductionOrderModel.findById(id)
    if (!order) throw new Error('Ordre de production non trouvé')
    if (order.status === 'in-progress' || order.status === 'completed') {
      throw new Error('Impossible de supprimer une production en cours ou terminée')
    }
    await ProductionOrderModel.delete(id)
  }
}

// ============================================
// SHOWCASE ITEM SERVICE
// ============================================

export class ShowcaseItemService {
  async getAll(): Promise<ShowcaseItem[]> {
    return ShowcaseItemModel.findAll()
  }

  async getByShowcase(showcaseId: string): Promise<ShowcaseItem[]> {
    const db = getDB()
    const docs = await db.collection('showcase_items')
      .find({ showcaseId })
      .sort({ productionDate: 1 })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)).filter(i => i !== null) as ShowcaseItem[]
  }
  
  async getAvailable(showcaseId?: string): Promise<ShowcaseItem[]> {
    const db = getDB()
    const now = new Date()
    const query: any = { quantity: { $gt: 0 }, expirationDate: { $gt: now } }
    if (showcaseId) query.showcaseId = showcaseId
    const docs = await db.collection('showcase_items')
      .find(query)
      .sort({ productionDate: 1 })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)).filter(i => i !== null) as ShowcaseItem[]
  }
  
  async getExpiringSoon(hours: number = 4): Promise<ShowcaseItem[]> {
    const db = getDB()
    const now = new Date()
    const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000)
    const docs = await db.collection('showcase_items')
      .find({ quantity: { $gt: 0 }, expirationDate: { $gte: now, $lte: threshold } })
      .sort({ expirationDate: 1 })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)).filter(i => i !== null) as ShowcaseItem[]
  }
  
  async getLowStock(): Promise<ShowcaseItem[]> {
    const db = getDB()
    const docs = await db.collection('showcase_items')
      .find({
        quantity: { $gt: 0 },
        $expr: { $lt: ['$quantity', { $multiply: ['$initialQuantity', 0.2] }] }
      })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)).filter(i => i !== null) as ShowcaseItem[]
  }
  
  async getById(id: string): Promise<ShowcaseItem | null> {
    return ShowcaseItemModel.findById(id)
  }
  
  async update(id: string, data: Partial<ShowcaseItem>): Promise<void> {
    const exists = await ShowcaseItemModel.findById(id)
    if (!exists) throw new Error('Produit en vitrine non trouvé')
    await ShowcaseItemModel.update(id, data)
  }
  
  async transfer(id: string, targetShowcaseId: string, quantity: number): Promise<void> {
    const item = await ShowcaseItemModel.findById(id)
    if (!item) throw new Error('Produit en vitrine non trouvé')
    if (quantity > item.quantity) throw new Error('Quantité insuffisante')
    
    const targetShowcase = await ShowcaseModel.findById(targetShowcaseId)
    if (!targetShowcase) throw new Error('Vitrine de destination non trouvée')
    
    await ShowcaseItemModel.decrementStock(id, quantity)
    await ShowcaseItemModel.create({
      recipeId: item.recipeId,
      productionOrderId: item.productionOrderId,
      showcaseId: targetShowcaseId,
      batchNumber: `${item.batchNumber}-TRANSFER`,
      quantity,
      initialQuantity: quantity,
      productionDate: item.productionDate,
      productionTime: item.productionTime,
      expirationDate: item.expirationDate,
      expirationTime: item.expirationTime,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice
    })
  }
  
  async delete(id: string): Promise<void> {
    await ShowcaseItemModel.delete(id)
  }
  
  async decrementStock(recipeId: string, quantity: number): Promise<boolean> {
    const availableItems = await this.getAvailable()
    const recipeItems = availableItems.filter(i => i.recipeId === recipeId)
    
    let remaining = quantity
    for (const item of recipeItems) {
      if (remaining <= 0) break
      const toDeduct = Math.min(item.quantity, remaining)
      await ShowcaseItemModel.decrementStock(item._id!, toDeduct)
      remaining -= toDeduct
    }
    
    return remaining === 0
  }
  
  async checkAvailability(recipeId: string, quantity: number = 1): Promise<{ available: boolean; stock: number }> {
    const availableItems = await this.getAvailable()
    const recipeItems = availableItems.filter(i => i.recipeId === recipeId)
    const totalStock = recipeItems.reduce((sum, i) => sum + i.quantity, 0)
    return { available: totalStock >= quantity, stock: totalStock }
  }
  
  async getAvailableRecipes(): Promise<{ recipeId: string; recipeName: string; stock: number }[]> {
    const availableItems = await this.getAvailable()
    const recipeStockMap = new Map<string, { recipeId: string; recipeName: string; stock: number }>()
    
    for (const item of availableItems) {
      const recipe = await RecipeModel.findById(item.recipeId)
      if (!recipe) continue
      
      const existing = recipeStockMap.get(item.recipeId)
      if (existing) {
        existing.stock += item.quantity
      } else {
        recipeStockMap.set(item.recipeId, {
          recipeId: item.recipeId,
          recipeName: recipe.name,
          stock: item.quantity
        })
      }
    }
    
    return Array.from(recipeStockMap.values())
  }
}

// ============================================
// PRODUCTION STATS SERVICE
// ============================================

export class ProductionStatsService {
  async getStats(): Promise<{
    totalRecipes: number
    activeRecipes: number
    totalShowcases: number
    activeShowcases: number
    plannedOrders: number
    inProgressOrders: number
    completedOrders: number
    totalShowcaseItems: number
    totalShowcaseQuantity: number
    lowStockItems: number
    expiringItems: number
  }> {
    const recipes = await RecipeModel.findAll()
    const activeRecipes = recipes.filter(r => r.isActive)
    
    const showcases = await ShowcaseModel.findAll()
    const activeShowcases = showcases.filter(s => s.isActive)
    
    const plannedOrders = await ProductionOrderModel.findByStatus('planned')
    const inProgressOrders = await ProductionOrderModel.findByStatus('in-progress')
    const completedOrders = await ProductionOrderModel.findByStatus('completed')
    
    const showcaseItems = await this.getAvailable()
    const totalShowcaseQuantity = showcaseItems.reduce((sum, i) => sum + i.quantity, 0)
    
    const lowStockItems = await this.getLowStock()
    const expiringItems = await this.getExpiringSoon(24)
    
    return {
      totalRecipes: recipes.length,
      activeRecipes: activeRecipes.length,
      totalShowcases: showcases.length,
      activeShowcases: activeShowcases.length,
      plannedOrders: plannedOrders.length,
      inProgressOrders: inProgressOrders.length,
      completedOrders: completedOrders.length,
      totalShowcaseItems: showcaseItems.length,
      totalShowcaseQuantity,
      lowStockItems: lowStockItems.length,
      expiringItems: expiringItems.length
    }
  }
  
  private async getAvailable(): Promise<ShowcaseItem[]> {
    const db = getDB()
    const now = new Date()
    const docs = await db.collection('showcase_items')
      .find({ quantity: { $gt: 0 }, expirationDate: { $gt: now } })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)).filter(i => i !== null) as ShowcaseItem[]
  }
  
  private async getLowStock(): Promise<ShowcaseItem[]> {
    const db = getDB()
    const docs = await db.collection('showcase_items')
      .find({
        quantity: { $gt: 0 },
        $expr: { $lt: ['$quantity', { $multiply: ['$initialQuantity', 0.2] }] }
      })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)).filter(i => i !== null) as ShowcaseItem[]
  }
  
  private async getExpiringSoon(hours: number): Promise<ShowcaseItem[]> {
    const db = getDB()
    const now = new Date()
    const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000)
    const docs = await db.collection('showcase_items')
      .find({ quantity: { $gt: 0 }, expirationDate: { $gte: now, $lte: threshold } })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)).filter(i => i !== null) as ShowcaseItem[]
  }
}

// ============================================
// EXPORT SINGLETONS
// ============================================

export const recipeCategoryService = new RecipeCategoryService()
export const recipeService = new RecipeService()
export const showcaseService = new ShowcaseService()
export const productionOrderService = new ProductionOrderService()
export const showcaseItemService = new ShowcaseItemService()
export const productionStatsService = new ProductionStatsService()
