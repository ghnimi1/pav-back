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
  categoryId: ObjectId | string  // Can be ObjectId in DB, string when returned
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
  categoryId: string | ObjectId  // Accept both string and ObjectId
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
    categoryId: doc.categoryId instanceof ObjectId ? doc.categoryId.toString() : doc.categoryId, // Convert ObjectId to string for client
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

    // Convert categoryId to ObjectId if it's a string
    const categoryIdObj = typeof input.categoryId === 'string' 
      ? new ObjectId(input.categoryId) 
      : input.categoryId

    const newItem: Omit<BreakfastItem, '_id'> = {
      name: input.name,
      description: input.description,
      price: input.price,
      points: input.points,
      categoryId: categoryIdObj, // Store as ObjectId
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
    return { 
      _id: result.insertedId.toString(), 
      ...newItem,
      categoryId: categoryIdObj.toString() // Convert to string for return
    }
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
    // Convert string categoryId to ObjectId for query
    const categoryIdObj = new ObjectId(categoryId)
    const docs = await db.collection(this.collection).find({ categoryId: categoryIdObj }).sort({ name: 1 }).toArray()
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
    const { _id, id: ignoreId, createdAt, categoryId, ...safeUpdates } = updates
    
    // Prepare update object
    const updateData: any = { ...safeUpdates, updatedAt: new Date() }
    
    // If categoryId is provided, convert it to ObjectId
    if (categoryId) {
      updateData.categoryId = typeof categoryId === 'string' 
        ? new ObjectId(categoryId) 
        : categoryId
    }
    
    await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
  },

  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) })
  },
}