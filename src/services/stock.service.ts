import { CategoryModel } from '../models/Category.model'
import type { Category } from '../models/Category.model'
import { SubCategoryModel } from '../models/SubCategory.model'
import type { SubCategory } from '../models/SubCategory.model'
import { ProductModel } from '../models/Product.model'
import type { Product, UnitType } from '../models/Product.model'
import { BatchModel } from '../models/Batch.model'
import type { Batch } from '../models/Batch.model'
import { getDB } from '../config/database'

// ============================================
// CATEGORY SERVICE
// ============================================

export interface CategoryWithStats extends Category {
  subCategoriesCount: number
  productsCount: number
}

export class CategoryService {
  async getAllCategories(): Promise<CategoryWithStats[]> {
    const categories = await CategoryModel.findAll()
    const result: CategoryWithStats[] = []
    
    for (const cat of categories) {
      const subCategories = await SubCategoryModel.findByCategory(cat._id!)
      let productsCount = 0
      
      for (const sub of subCategories) {
        const products = await ProductModel.findBySubCategory(sub._id!)
        productsCount += products.length
      }
      
      result.push({
        ...cat,
        subCategoriesCount: subCategories.length,
        productsCount
      })
    }
    
    return result
  }
  
  async getCategoryById(id: string): Promise<Category | null> {
    return CategoryModel.findById(id)
  }
  
  async createCategory(data: {
    name: string
    slug?: string
    description?: string
    icon?: string
    color?: string
    order?: number
    isActive?: boolean
  }): Promise<Category> {
    const existing = await CategoryModel.findBySlug(data.slug || this.generateSlug(data.name))
    if (existing) {
      throw new Error('Une catégorie avec ce nom existe déjà')
    }
    return CategoryModel.create(data)
  }
  
  async updateCategory(id: string, data: Partial<Category>): Promise<void> {
    const category = await CategoryModel.findById(id)
    if (!category) {
      throw new Error('Catégorie non trouvée')
    }
    await CategoryModel.update(id, data)
  }
  
  async deleteCategory(id: string): Promise<void> {
    const category = await CategoryModel.findById(id)
    if (!category) {
      throw new Error('Catégorie non trouvée')
    }
    
    const subCategories = await SubCategoryModel.findByCategory(id)
    if (subCategories.length > 0) {
      throw new Error('Impossible de supprimer une catégorie qui contient des sous-catégories')
    }
    
    await CategoryModel.delete(id)
  }
  
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

// ============================================
// SUB-CATEGORY SERVICE
// ============================================

export interface SubCategoryWithStats extends SubCategory {
  productsCount: number
}

export class SubCategoryService {
  async getAllSubCategories(): Promise<SubCategoryWithStats[]> {
    const subCategories = await SubCategoryModel.findAll()
    const result: SubCategoryWithStats[] = []
    
    for (const sub of subCategories) {
      const products = await ProductModel.findBySubCategory(sub._id!)
      result.push({
        ...sub,
        productsCount: products.length
      })
    }
    
    return result
  }
  
  async getSubCategoriesByCategory(categoryId: string): Promise<SubCategoryWithStats[]> {
    const subCategories = await SubCategoryModel.findByCategory(categoryId)
    const result: SubCategoryWithStats[] = []
    
    for (const sub of subCategories) {
      const products = await ProductModel.findBySubCategory(sub._id!)
      result.push({
        ...sub,
        productsCount: products.length
      })
    }
    
    return result
  }
  
  async getSubCategoryById(id: string): Promise<SubCategory | null> {
    return SubCategoryModel.findById(id)
  }
  
  async createSubCategory(data: {
    categoryId: string
    name: string
    slug?: string
    description?: string
    icon?: string
    order?: number
    isActive?: boolean
  }): Promise<SubCategory> {
    const category = await CategoryModel.findById(data.categoryId)
    if (!category) {
      throw new Error('Catégorie parente non trouvée')
    }
    return SubCategoryModel.create(data)
  }
  
  async updateSubCategory(id: string, data: Partial<SubCategory>): Promise<void> {
    const subCategory = await SubCategoryModel.findById(id)
    if (!subCategory) {
      throw new Error('Sous-catégorie non trouvée')
    }
    await SubCategoryModel.update(id, data)
  }
  
  async deleteSubCategory(id: string): Promise<void> {
    const subCategory = await SubCategoryModel.findById(id)
    if (!subCategory) {
      throw new Error('Sous-catégorie non trouvée')
    }
    
    const products = await ProductModel.findBySubCategory(id)
    if (products.length > 0) {
      throw new Error('Impossible de supprimer une sous-catégorie qui contient des produits')
    }
    
    await SubCategoryModel.delete(id)
  }
}

// ============================================
// PRODUCT SERVICE
// ============================================

export interface ProductWithStock extends Product {
  currentStock: number
  batchesCount: number
  activeBatchesCount: number
  totalValue: number
  status: 'ok' | 'low' | 'critical'
}

export class ProductService {
  async getAllProducts(): Promise<ProductWithStock[]> {
    const products = await ProductModel.findAll()
    const result: ProductWithStock[] = []
    
    for (const product of products) {
      const stock = await this.getProductStock(product._id!)
      const batches = await BatchModel.findByProduct(product._id!)
      const activeBatches = batches.filter(b => b.quantity > 0)
      const totalValue = batches.reduce((sum, b) => sum + (b.quantity * b.unitCost), 0)
      
      let status: 'ok' | 'low' | 'critical' = 'ok'
      if (stock <= product.minQuantity / 2) {
        status = 'critical'
      } else if (stock <= product.minQuantity) {
        status = 'low'
      }
      
      result.push({
        ...product,
        currentStock: stock,
        batchesCount: batches.length,
        activeBatchesCount: activeBatches.length,
        totalValue,
        status
      })
    }
    
    return result
  }
  
  async getProductById(id: string): Promise<ProductWithStock | null> {
    const product = await ProductModel.findById(id)
    if (!product) return null
    
    const stock = await this.getProductStock(id)
    const batches = await BatchModel.findByProduct(id)
    const activeBatches = batches.filter(b => b.quantity > 0)
    const totalValue = batches.reduce((sum, b) => sum + (b.quantity * b.unitCost), 0)
    
    let status: 'ok' | 'low' | 'critical' = 'ok'
    if (stock <= product.minQuantity / 2) {
      status = 'critical'
    } else if (stock <= product.minQuantity) {
      status = 'low'
    }
    
    return {
      ...product,
      currentStock: stock,
      batchesCount: batches.length,
      activeBatchesCount: activeBatches.length,
      totalValue,
      status
    }
  }
  
  async getProductsBySubCategory(subCategoryId: string): Promise<ProductWithStock[]> {
    const products = await ProductModel.findBySubCategory(subCategoryId)
    const result: ProductWithStock[] = []
    
    for (const product of products) {
      const stock = await this.getProductStock(product._id!)
      const batches = await BatchModel.findByProduct(product._id!)
      const totalValue = batches.reduce((sum, b) => sum + (b.quantity * b.unitCost), 0)
      
      result.push({
        ...product,
        currentStock: stock,
        batchesCount: batches.length,
        activeBatchesCount: batches.filter(b => b.quantity > 0).length,
        totalValue,
        status: stock <= product.minQuantity ? 'low' : 'ok'
      })
    }
    
    return result
  }
  
  async createProduct(data: {
    subCategoryId: string
    name: string
    description?: string
    unit: UnitType
    minQuantity?: number
    unitPrice: number
    shelfLifeAfterOpening?: number
    supplierId?: string
    defaultLocationId?: string
    image?: string
    isActive?: boolean
  }): Promise<Product> {
    const subCategory = await SubCategoryModel.findById(data.subCategoryId)
    if (!subCategory) {
      throw new Error('Sous-catégorie non trouvée')
    }
    return ProductModel.create(data)
  }
  
  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    const product = await ProductModel.findById(id)
    if (!product) {
      throw new Error('Produit non trouvé')
    }
    await ProductModel.update(id, data)
  }
  
  async deleteProduct(id: string): Promise<void> {
    const product = await ProductModel.findById(id)
    if (!product) {
      throw new Error('Produit non trouvé')
    }
    
    const batches = await BatchModel.findByProduct(id)
    if (batches.length > 0) {
      throw new Error('Impossible de supprimer un produit qui a des lots')
    }
    
    await ProductModel.delete(id)
  }
  
  async getProductStock(productId: string): Promise<number> {
    const batches = await BatchModel.findActiveByProduct(productId)
    return batches.reduce((sum, b) => sum + b.quantity, 0)
  }
  
  async getLowStockProducts(): Promise<ProductWithStock[]> {
    const allProducts = await this.getAllProducts()
    return allProducts.filter(p => p.status === 'low' || p.status === 'critical')
  }
}

// ============================================
// BATCH SERVICE (FIFO)
// ============================================

export interface BatchWithProduct extends Batch {
  productName: string
  daysUntilExpiration: number
  isExpired: boolean
  isExpiringSoon: boolean
  value: number
}

export class BatchService {
  async getBatchesByProduct(productId: string): Promise<BatchWithProduct[]> {
    const product = await ProductModel.findById(productId)
    if (!product) {
      throw new Error('Produit non trouvé')
    }
    
    const batches = await BatchModel.findByProduct(productId)
    const now = new Date()
    
    return batches.map(batch => {
      const expirationDate = batch.isOpened && batch.expirationAfterOpening 
        ? new Date(batch.expirationAfterOpening) 
        : new Date(batch.expirationDate)
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isExpired = daysUntilExpiration < 0
      const isExpiringSoon = daysUntilExpiration >= 0 && daysUntilExpiration <= 7
      
      return {
        ...batch,
        productName: product.name,
        daysUntilExpiration,
        isExpired,
        isExpiringSoon,
        value: batch.quantity * batch.unitCost
      }
    })
  }
  
  async getActiveBatches(productId: string): Promise<BatchWithProduct[]> {
    const batches = await this.getBatchesByProduct(productId)
    return batches.filter(b => !b.isExpired && b.quantity > 0)
  }
  
  async createBatch(data: {
    productId: string
    supplierId?: string
    locationId?: string
    batchNumber: string
    quantity: number
    unitCost: number
    receptionDate: Date | string
    productionDate?: Date | string
    expirationDate: Date | string
    notes?: string
  }): Promise<Batch> {
    const product = await ProductModel.findById(data.productId)
    if (!product) {
      throw new Error('Produit non trouvé')
    }
    
    const existingBatches = await BatchModel.findByProduct(data.productId)
    const duplicate = existingBatches.find(b => b.batchNumber === data.batchNumber)
    if (duplicate) {
      throw new Error('Un lot avec ce numéro existe déjà pour ce produit')
    }
    
    return BatchModel.create(data)
  }
  
  async updateBatch(id: string, data: Partial<Batch>): Promise<void> {
    const batch = await BatchModel.findById(id)
    if (!batch) {
      throw new Error('Lot non trouvé')
    }
    await BatchModel.update(id, data)
  }
  
  async deleteBatch(id: string): Promise<void> {
    const batch = await BatchModel.findById(id)
    if (!batch) {
      throw new Error('Lot non trouvé')
    }
    await BatchModel.delete(id)
  }
  
  async openBatch(id: string, openingDate: Date, productShelfLife?: number): Promise<void> {
    const batch = await BatchModel.findById(id)
    if (!batch) {
      throw new Error('Lot non trouvé')
    }
    
    if (batch.isOpened) {
      throw new Error('Ce lot est déjà ouvert')
    }
    
    let newExpirationDate: Date | undefined = undefined
    if (productShelfLife) {
      newExpirationDate = new Date(openingDate)
      newExpirationDate.setDate(newExpirationDate.getDate() + productShelfLife)
    }
    
    await BatchModel.openBatch(id, openingDate, newExpirationDate)
  }
  
  async consumeStock(productId: string, quantity: number): Promise<boolean> {
    const currentStock = await new ProductService().getProductStock(productId)
    if (currentStock < quantity) {
      return false
    }
    return BatchModel.consumeFIFO(productId, quantity)
  }
  
  async getExpiringBatches(daysThreshold: number = 30): Promise<BatchWithProduct[]> {
    const batches = await BatchModel.getExpiringSoon(daysThreshold)
    const result: BatchWithProduct[] = []
    
    for (const batch of batches) {
      const product = await ProductModel.findById(batch.productId)
      if (product) {
        const expirationDate = batch.isOpened && batch.expirationAfterOpening 
          ? new Date(batch.expirationAfterOpening) 
          : new Date(batch.expirationDate)
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        
        result.push({
          ...batch,
          productName: product.name,
          daysUntilExpiration,
          isExpired: daysUntilExpiration < 0,
          isExpiringSoon: daysUntilExpiration >= 0 && daysUntilExpiration <= 7,
          value: batch.quantity * batch.unitCost
        })
      }
    }
    
    return result
  }
  
  async getTotalStockValue(): Promise<number> {
    const db = getDB()
    const batches = await db.collection('batches').find({ quantity: { $gt: 0 } }).toArray()
    return batches.reduce((sum, b) => sum + (b.quantity * b.unitCost), 0)
  }
  
  async getStockStats(): Promise<{
    totalProducts: number
    totalBatches: number
    totalValue: number
    lowStockCount: number
    expiringCount: number
  }> {
    const db = getDB()
    const products = await ProductModel.findAll()
    const batches = await db.collection('batches').find({}).toArray()
    const lowStockProducts = await new ProductService().getLowStockProducts()
    const expiringBatches = await this.getExpiringBatches(30)
    
    return {
      totalProducts: products.length,
      totalBatches: batches.length,
      totalValue: await this.getTotalStockValue(),
      lowStockCount: lowStockProducts.length,
      expiringCount: expiringBatches.length
    }
  }
}

// ============================================
// EXPORT SERVICES
// ============================================

export const categoryService = new CategoryService()
export const subCategoryService = new SubCategoryService()
export const productService = new ProductService()
export const batchService = new BatchService()