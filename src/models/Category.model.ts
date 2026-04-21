import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface Category {
  _id?: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateCategoryInput {
  name: string
  slug?: string
  description?: string
  icon?: string
  color?: string
  order?: number
  isActive?: boolean
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Helper functions for type conversion
function toCategory(doc: WithId<Document> | null): Category | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    icon: doc.icon,
    color: doc.color,
    order: doc.order,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

function toCategories(docs: WithId<Document>[]): Category[] {
  return docs.map(doc => toCategory(doc)!).filter((c): c is Category => c !== null)
}

export const CategoryModel = {
  collection: 'categories',
  
  async create(input: CreateCategoryInput): Promise<Category> {
    const db = getDB()
    const now = new Date()
    const slug = input.slug || generateSlug(input.name)
    
    // Get max order
    const lastCategory = await db.collection('categories')
      .find({})
      .sort({ order: -1 })
      .limit(1)
      .toArray()
    
    const order = input.order !== undefined ? input.order : (lastCategory[0]?.order || 0) + 1
    
    const newCategory: Omit<Category, '_id'> = {
      name: input.name,
      slug,
      description: input.description,
      icon: input.icon || '📦',
      color: input.color || '#6b7280',
      order,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('categories').insertOne(newCategory)
    return { _id: result.insertedId.toString(), ...newCategory }
  },
  
  async findAll(): Promise<Category[]> {
    const db = getDB()
    const docs = await db.collection('categories')
      .find({})
      .sort({ order: 1 })
      .toArray()
    return toCategories(docs)
  },
  
  async findById(id: string): Promise<Category | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('categories').findOne({ _id: new ObjectId(id) })
    return toCategory(doc)
  },
  
  async findBySlug(slug: string): Promise<Category | null> {
    const db = getDB()
    const doc = await db.collection('categories').findOne({ slug })
    return toCategory(doc)
  },
  
  async update(id: string, updates: Partial<Category>): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    
    const { _id, ...updateData } = updates as any
    
    await db.collection('categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    await db.collection('categories').deleteOne({ _id: new ObjectId(id) })
  },
  
  async getSubCategoriesCount(id: string): Promise<number> {
    const db = getDB()
    return await db.collection('subcategories').countDocuments({ categoryId: id })
  }
}