import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export type UnitType = 'kg' | 'g' | 'L' | 'ml' | 'pieces' | 'sachets' | 'boites'

export interface Product {
  _id?: string
  subCategoryId: string
  name: string
  description?: string
  unit: UnitType
  minQuantity: number
  unitPrice: number
  shelfLifeAfterOpening?: number
  supplierId?: string
  defaultLocationId?: string
  image?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateProductInput {
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
}

// Helper functions for type conversion
function toProduct(doc: WithId<Document> | null): Product | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    subCategoryId: doc.subCategoryId,
    name: doc.name,
    description: doc.description,
    unit: doc.unit,
    minQuantity: doc.minQuantity || 5,
    unitPrice: doc.unitPrice,
    shelfLifeAfterOpening: doc.shelfLifeAfterOpening,
    supplierId: doc.supplierId,
    defaultLocationId: doc.defaultLocationId,
    image: doc.image,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

function toProducts(docs: WithId<Document>[]): Product[] {
  return docs.map(doc => toProduct(doc)!).filter((p): p is Product => p !== null)
}

export const ProductModel = {
  collection: 'products',
  
  async create(input: CreateProductInput): Promise<Product> {
    const db = getDB()
    const now = new Date()
    
    const newProduct: Omit<Product, '_id'> = {
      subCategoryId: input.subCategoryId,
      name: input.name,
      description: input.description,
      unit: input.unit,
      minQuantity: input.minQuantity || 5,
      unitPrice: input.unitPrice,
      shelfLifeAfterOpening: input.shelfLifeAfterOpening,
      supplierId: input.supplierId,
      defaultLocationId: input.defaultLocationId,
      image: input.image,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('products').insertOne(newProduct)
    return { _id: result.insertedId.toString(), ...newProduct }
  },
  
  async findAll(): Promise<Product[]> {
    const db = getDB()
    const docs = await db.collection('products')
      .find({})
      .sort({ name: 1 })
      .toArray()
    return toProducts(docs)
  },
  
  async findActive(): Promise<Product[]> {
    const db = getDB()
    const docs = await db.collection('products')
      .find({ isActive: true })
      .sort({ name: 1 })
      .toArray()
    return toProducts(docs)
  },
  
  async findById(id: string): Promise<Product | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('products').findOne({ _id: new ObjectId(id) })
    return toProduct(doc)
  },
  
  async findBySubCategory(subCategoryId: string): Promise<Product[]> {
    const db = getDB()
    const docs = await db.collection('products')
      .find({ subCategoryId })
      .sort({ name: 1 })
      .toArray()
    return toProducts(docs)
  },
  
  async findBySupplier(supplierId: string): Promise<Product[]> {
    const db = getDB()
    const docs = await db.collection('products')
      .find({ supplierId })
      .sort({ name: 1 })
      .toArray()
    return toProducts(docs)
  },
  
  async update(id: string, updates: Partial<Product>): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    
    const { _id, ...updateData } = updates as any
    
    await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    await db.collection('products').deleteOne({ _id: new ObjectId(id) })
  },
  
  async getTotalStock(id: string): Promise<number> {
    const db = getDB()
    const batches = await db.collection('batches')
      .find({ productId: id })
      .toArray()
    return batches.reduce((sum, b) => sum + (b.quantity || 0), 0)
  },
  
  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const allProducts = await this.findAll()
    const lowStock: Product[] = []
    
    for (const product of allProducts) {
      const stock = await this.getTotalStock(product._id!)
      if (stock <= (threshold || product.minQuantity)) {
        lowStock.push(product)
      }
    }
    
    return lowStock
  },
  
  async countBySubCategory(subCategoryId: string): Promise<number> {
    const db = getDB()
    return await db.collection('products').countDocuments({ subCategoryId })
  },
  
  async toggleActive(id: string): Promise<void> {
    const product = await this.findById(id)
    if (!product) throw new Error('Produit non trouvé')
    await this.update(id, { isActive: !product.isActive })
  }
}