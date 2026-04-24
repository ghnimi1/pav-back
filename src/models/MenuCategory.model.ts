import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface MenuCategory {
  _id?: string
  id?: string
  name: string
  slug: string
  icon?: string
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateMenuCategoryInput {
  name: string
  slug?: string
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

function toMenuCategory(doc: WithId<Document> | null): MenuCategory | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    icon: doc.icon || '🍰',
    order: doc.order || 1,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const MenuCategoryModel = {
  collection: 'menu_categories',
  
  async create(input: CreateMenuCategoryInput): Promise<MenuCategory> {
    const db = getDB()
    const now = new Date()
    const slug = input.slug || generateSlug(input.name)
    
    const lastCat = await db.collection('menu_categories')
      .find({})
      .sort({ order: -1 })
      .limit(1)
      .toArray()
    
    const order = input.order !== undefined ? input.order : (lastCat[0]?.order || 0) + 1
    
    const newCategory: Omit<MenuCategory, '_id'> = {
      name: input.name,
      slug,
      icon: input.icon || '🍰',
      order,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('menu_categories').insertOne(newCategory)
    return { _id: result.insertedId.toString(), ...newCategory }
  },
  
  async findAll(): Promise<MenuCategory[]> {
    const db = getDB()
    const docs = await db.collection('menu_categories')
      .find({})
      .sort({ order: 1 })
      .toArray()
    return docs.map(doc => toMenuCategory(doc)!).filter(c => c !== null)
  },
  
  async findActive(): Promise<MenuCategory[]> {
    const db = getDB()
    const docs = await db.collection('menu_categories')
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray()
    return docs.map(doc => toMenuCategory(doc)!).filter(c => c !== null)
  },
  
  async findById(id: string| ObjectId): Promise<MenuCategory | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('menu_categories').findOne({ _id: new ObjectId(id) })
    return toMenuCategory(doc)
  },
  
  async findBySlug(slug: string): Promise<MenuCategory | null> {
    const db = getDB()
    const doc = await db.collection('menu_categories').findOne({ slug })
    return toMenuCategory(doc)
  },
  
  async update(id: string, updates: Partial<MenuCategory>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    await db.collection('menu_categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('menu_categories').deleteOne({ _id: new ObjectId(id) })
  }
}