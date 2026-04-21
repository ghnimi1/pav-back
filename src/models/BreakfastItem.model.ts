import { getDB } from '../config/database'
import { ObjectId, type Document, type WithId } from 'mongodb'

export interface BreakfastSupplementConfig {
  supplementId: string
  isEnabled: boolean
  customPrice?: number
}

export interface BreakfastItem {
  _id?: string
  name: string
  description?: string
  price: number
  points?: number
  categoryId: string
  image?: string
  isAvailable: boolean
  isRequired?: boolean
  minQuantity?: number
  maxQuantity?: number
  availableSupplements?: BreakfastSupplementConfig[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateBreakfastItemInput {
  name: string
  description?: string
  price: number
  points?: number
  categoryId: string
  image?: string
  isAvailable?: boolean
  isRequired?: boolean
  minQuantity?: number
  maxQuantity?: number
  availableSupplements?: BreakfastSupplementConfig[]
}

function toBreakfastItem(doc: WithId<Document> | null): BreakfastItem | null {
  if (!doc) return null

  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    points: doc.points,
    categoryId: doc.categoryId,
    image: doc.image,
    isAvailable: doc.isAvailable ?? true,
    isRequired: doc.isRequired,
    minQuantity: doc.minQuantity,
    maxQuantity: doc.maxQuantity,
    availableSupplements: doc.availableSupplements,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const BreakfastItemModel = {
  collection: 'breakfast_items',

  async create(input: CreateBreakfastItemInput): Promise<BreakfastItem> {
    const db = getDB()
    const now = new Date()

    const newItem: Omit<BreakfastItem, '_id'> = {
      name: input.name,
      description: input.description,
      price: input.price,
      points: input.points,
      categoryId: input.categoryId,
      image: input.image,
      isAvailable: input.isAvailable !== false,
      isRequired: input.isRequired,
      minQuantity: input.minQuantity,
      maxQuantity: input.maxQuantity,
      availableSupplements: input.availableSupplements,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection(this.collection).insertOne(newItem)
    return { _id: result.insertedId.toString(), ...newItem }
  },

  async findAll(): Promise<BreakfastItem[]> {
    const db = getDB()
    const docs = await db.collection(this.collection).find({}).sort({ name: 1 }).toArray()
    return docs.map((doc) => toBreakfastItem(doc)!).filter(Boolean)
  },

  async findActive(): Promise<BreakfastItem[]> {
    const db = getDB()
    const docs = await db.collection(this.collection).find({ isAvailable: true }).sort({ name: 1 }).toArray()
    return docs.map((doc) => toBreakfastItem(doc)!).filter(Boolean)
  },

  async findByCategory(categoryId: string): Promise<BreakfastItem[]> {
    const db = getDB()
    const docs = await db.collection(this.collection).find({ categoryId }).sort({ name: 1 }).toArray()
    return docs.map((doc) => toBreakfastItem(doc)!).filter(Boolean)
  },

  async findById(id: string): Promise<BreakfastItem | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection(this.collection).findOne({ _id: new ObjectId(id) })
    return toBreakfastItem(doc)
  },

  async update(id: string, updates: Partial<BreakfastItem>): Promise<void> {
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
