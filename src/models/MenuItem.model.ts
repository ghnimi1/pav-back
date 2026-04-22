import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface MenuSupplement {
  supplementId: string
  isEnabled: boolean
  customPrice?: number
}

export interface MenuPromotion {
  type: 'percentage' | 'fixed' | 'offer' | 'new' | 'popular'
  value?: number
  label?: string
  endDate?: Date
}

export interface MenuItem {
  _id?: string
  name: string
  description: string
  price: number
  points?: number
  categoryId: string
  image?: string
  allergens: string[]
  isAvailable: boolean
  tags?: string[]
  supplements?: MenuSupplement[]
  promotion?: MenuPromotion
  recipeId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMenuItemInput {
  name: string
  description: string
  price: number
  points?: number
  categoryId: string
  image?: string
  allergens?: string[]
  isAvailable?: boolean
  tags?: string[]
  supplements?: MenuSupplement[]
  promotion?: MenuPromotion
  recipeId?: string
}

function toMenuItem(doc: WithId<Document> | null): MenuItem | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    points: doc.points,
    categoryId: doc.categoryId,
    image: doc.image,
    allergens: doc.allergens || [],
    isAvailable: doc.isAvailable ?? true,
    tags: doc.tags,
    supplements: doc.supplements,
    promotion: doc.promotion,
    recipeId: doc.recipeId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const MenuItemModel = {
  collection: 'menu_items',
  
  async create(input: CreateMenuItemInput): Promise<MenuItem> {
    const db = getDB()
    const now = new Date()
    
    const newItem: Omit<MenuItem, '_id'> = {
      name: input.name,
      description: input.description,
      price: input.price,
      points: input.points,
      categoryId: input.categoryId,
      image: input.image,
      allergens: input.allergens || [],
      isAvailable: input.isAvailable !== false,
      tags: input.tags,
      supplements: input.supplements,
      promotion: input.promotion,
      recipeId: input.recipeId,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('menu_items').insertOne(newItem)
    return { _id: result.insertedId.toString(), ...newItem }
  },
  
  async findAll(): Promise<MenuItem[]> {
    const db = getDB()
    const docs = await db.collection('menu_items')
      .find({})
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toMenuItem(doc)!).filter(i => i !== null)
  },
  
  async findActive(): Promise<MenuItem[]> {
    const db = getDB()
    const docs = await db.collection('menu_items')
      .find({ isAvailable: true })
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toMenuItem(doc)!).filter(i => i !== null)
  },
  
  async findByCategory(categoryId: string): Promise<MenuItem[]> {
    const db = getDB()
    const docs = await db.collection('menu_items')
      .find({ categoryId })
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toMenuItem(doc)!).filter(i => i !== null)
  },
  
  async findById(id: string): Promise<MenuItem | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('menu_items').findOne({ _id: new ObjectId(id) })
    return toMenuItem(doc)
  },
  
  async update(id: string, updates: Partial<MenuItem>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    await db.collection('menu_items').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('menu_items').deleteOne({ _id: new ObjectId(id) })
  },
  
  async toggleAvailability(id: string): Promise<void> {
    const item = await this.findById(id)
    if (!item) throw new Error('Item non trouvé')
    await this.update(id, { isAvailable: !item.isAvailable })
  }
}