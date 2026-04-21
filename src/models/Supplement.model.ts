import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface Supplement {
  _id?: string
  name: string
  price: number
  points?: number
  description?: string
  image?: string
  category?: string
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
  category?: string
  isActive?: boolean
}

function toSupplement(doc: WithId<Document> | null): Supplement | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    points: doc.points,
    description: doc.description,
    image: doc.image,
    category: doc.category,
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
    
    const newSupplement: Omit<Supplement, '_id'> = {
      name: input.name,
      price: input.price,
      points: input.points,
      description: input.description,
      image: input.image,
      category: input.category,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('supplements').insertOne(newSupplement)
    return { _id: result.insertedId.toString(), ...newSupplement }
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
    await db.collection('supplements').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('supplements').deleteOne({ _id: new ObjectId(id) })
  }
}