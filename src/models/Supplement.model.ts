import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface Supplement {
  _id?: string
  id?: string
  name: string
  price: number
  points?: number
  description?: string
  image?: string
  category?: string | ObjectId  // Accept both string and ObjectId
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSupplementInput {
  name: string
  price: number
  points?: number
  description?: string
  image?: string
  category?: string  // Should be a string ID from frontend
  isActive?: boolean
}

function toSupplement(doc: WithId<Document> | null): Supplement | null {
  if (!doc) return null
  
  // Convert ObjectId category to string for frontend
  let categoryId: string | undefined = undefined
  if (doc.category) {
    if (doc.category instanceof ObjectId) {
      categoryId = doc.category.toString()
    } else if (typeof doc.category === 'string') {
      categoryId = doc.category
    }
  }
  
  return {
    _id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    points: doc.points,
    description: doc.description,
    image: doc.image,
    category: categoryId,  // Always return as string
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const SupplementModel = {
  collection: 'supplements',
  
  async create(input: CreateSupplementInput): Promise<Supplement> {
    const db = getDB()
    const now = new Date()
    
    // Convert category string to ObjectId if it looks like a valid ObjectId
    let categoryValue: ObjectId | string | undefined = undefined
    if (input.category) {
      if (ObjectId.isValid(input.category)) {
        categoryValue = new ObjectId(input.category)
      } else {
        categoryValue = input.category
      }
    }
    
    const newSupplement: Omit<Supplement, '_id'> = {
      name: input.name,
      price: input.price,
      points: input.points,
      description: input.description,
      image: input.image,
      category: categoryValue,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('supplements').insertOne(newSupplement)
    return { 
      _id: result.insertedId.toString(), 
      ...newSupplement,
      category: input.category  // Return the original string ID for frontend
    }
  },
  
  async findAll(): Promise<Supplement[]> {
    const db = getDB()
    const docs = await db.collection('supplements')
      .find({})
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toSupplement(doc)!).filter(s => s !== null)
  },
  
  async findActive(): Promise<Supplement[]> {
    const db = getDB()
    const docs = await db.collection('supplements')
      .find({ isActive: true })
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toSupplement(doc)!).filter(s => s !== null)
  },
  
  async findById(id: string): Promise<Supplement | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('supplements').findOne({ _id: new ObjectId(id) })
    return toSupplement(doc)
  },
  
  async update(id: string, updates: Partial<Supplement>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    
    // Convert category string to ObjectId if provided and valid
    const updateData: any = { ...safeUpdates, updatedAt: new Date() }
    if (updates.category) {
      if (ObjectId.isValid(updates.category)) {
        updateData.category = new ObjectId(updates.category)
      } else {
        updateData.category = updates.category
      }
    }
    
    await db.collection('supplements').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('supplements').deleteOne({ _id: new ObjectId(id) })
  }
}