import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface SubCategory {
  _id?: string
  categoryId: string
  name: string
  slug: string
  description?: string
  icon?: string
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSubCategoryInput {
  categoryId: string
  name: string
  slug?: string
  description?: string
  icon?: string
  order?: number
  isActive?: boolean
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toSubCategory(doc: WithId<Document> | null): SubCategory | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    categoryId: doc.categoryId,
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    icon: doc.icon,
    order: doc.order,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

function toSubCategories(docs: WithId<Document>[]): SubCategory[] {
  return docs.map(doc => toSubCategory(doc)!).filter((s): s is SubCategory => s !== null)
}

export const SubCategoryModel = {
  collection: 'subcategories',
  
  async create(input: CreateSubCategoryInput): Promise<SubCategory> {
    const db = getDB()
    const now = new Date()
    const slug = input.slug || generateSlug(input.name)
    
    // Get max order for this category
    const lastSub = await db.collection('subcategories')
      .find({ categoryId: input.categoryId })
      .sort({ order: -1 })
      .limit(1)
      .toArray()
    
    const order = input.order !== undefined ? input.order : (lastSub[0]?.order || 0) + 1
    
    const newSubCategory: Omit<SubCategory, '_id'> = {
      categoryId: input.categoryId,
      name: input.name,
      slug,
      description: input.description,
      icon: input.icon || '📁',
      order,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('subcategories').insertOne(newSubCategory)
    return { _id: result.insertedId.toString(), ...newSubCategory }
  },
  
  async findAll(): Promise<SubCategory[]> {
    const db = getDB()
    const docs = await db.collection('subcategories')
      .find({})
      .sort({ categoryId: 1, order: 1 })
      .toArray()
    return toSubCategories(docs)
  },
  
  async findById(id: string): Promise<SubCategory | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('subcategories').findOne({ _id: new ObjectId(id) })
    return toSubCategory(doc)
  },
  
  async findByCategory(categoryId: string): Promise<SubCategory[]> {
    const db = getDB()
    const docs = await db.collection('subcategories')
      .find({ categoryId })
      .sort({ order: 1 })
      .toArray()
    return toSubCategories(docs)
  },
  
  async update(id: string, updates: Partial<SubCategory>): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates as any
    
    await db.collection('subcategories').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    await db.collection('subcategories').deleteOne({ _id: new ObjectId(id) })
  },
  
  async getProductsCount(id: string): Promise<number> {
    const db = getDB()
    return await db.collection('products').countDocuments({ subCategoryId: id })
  }
}