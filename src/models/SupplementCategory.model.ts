// models/SupplementCategory.model.ts
import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface SupplementCategory {
  _id?: string
  name: string
  color: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSupplementCategoryInput {
  name: string
  color: string
  isActive?: boolean
}

function toSupplementCategory(doc: WithId<Document> | null): SupplementCategory | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    color: doc.color,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const SupplementCategoryModel = {
  collection: 'supplement_categories',
  
  async create(input: CreateSupplementCategoryInput): Promise<SupplementCategory> {
    const db = getDB()
    const now = new Date()
    
    const newCategory: Omit<SupplementCategory, '_id'> = {
      name: input.name,
      color: input.color,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection(this.collection).insertOne(newCategory)
    return { _id: result.insertedId.toString(), ...newCategory }
  },
  
  async findAll(): Promise<SupplementCategory[]> {
    const db = getDB()
    const docs = await db.collection(this.collection)
      .find({})
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toSupplementCategory(doc)!).filter(c => c !== null)
  },
  
  async findActive(): Promise<SupplementCategory[]> {
    const db = getDB()
    const docs = await db.collection(this.collection)
      .find({ isActive: true })
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toSupplementCategory(doc)!).filter(c => c !== null)
  },
  
  async findById(id: string): Promise<SupplementCategory | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection(this.collection).findOne({ _id: new ObjectId(id) })
    return toSupplementCategory(doc)
  },
  
  async update(id: string, updates: Partial<SupplementCategory>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) })
  },
  
  async getSupplementsCount(id: string): Promise<number> {
    const db = getDB()
    return await db.collection('supplements').countDocuments({ categoryId: id })
  }
}