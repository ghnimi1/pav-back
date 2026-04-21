import { getDB } from '../config/database'
import { ObjectId, type Document, type WithId } from 'mongodb'

export interface BreakfastCategory {
  _id?: string
  name: string
  icon: string
  description?: string
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateBreakfastCategoryInput {
  name: string
  icon?: string
  description?: string
  order?: number
  isActive?: boolean
}

function toBreakfastCategory(doc: WithId<Document> | null): BreakfastCategory | null {
  if (!doc) return null

  return {
    _id: doc._id.toString(),
    name: doc.name,
    icon: doc.icon || 'star',
    description: doc.description,
    order: doc.order || 0,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const BreakfastCategoryModel = {
  collection: 'breakfast_categories',

  async create(input: CreateBreakfastCategoryInput): Promise<BreakfastCategory> {
    const db = getDB()
    const now = new Date()

    const lastCategory = await db.collection(this.collection).find({}).sort({ order: -1 }).limit(1).toArray()
    const order = input.order ?? ((lastCategory[0]?.order || 0) + 1)

    const newCategory: Omit<BreakfastCategory, '_id'> = {
      name: input.name,
      icon: input.icon || 'star',
      description: input.description,
      order,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection(this.collection).insertOne(newCategory)
    return { _id: result.insertedId.toString(), ...newCategory }
  },

  async findAll(): Promise<BreakfastCategory[]> {
    const db = getDB()
    const docs = await db.collection(this.collection).find({}).sort({ order: 1 }).toArray()
    return docs.map((doc) => toBreakfastCategory(doc)!).filter(Boolean)
  },

  async findActive(): Promise<BreakfastCategory[]> {
    const db = getDB()
    const docs = await db.collection(this.collection).find({ isActive: true }).sort({ order: 1 }).toArray()
    return docs.map((doc) => toBreakfastCategory(doc)!).filter(Boolean)
  },

  async findById(id: string): Promise<BreakfastCategory | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection(this.collection).findOne({ _id: new ObjectId(id) })
    return toBreakfastCategory(doc)
  },

  async update(id: string, updates: Partial<BreakfastCategory>): Promise<void> {
    const db = getDB()
    await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )
  },

  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) })
  },
}
