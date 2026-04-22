import { getDB } from '../config/database'
import { ObjectId, type Document, type WithId } from 'mongodb'

export interface BreakfastSupplementConfig {
  supplementId: string | ObjectId
  isEnabled: boolean
  customPrice?: number
}

export interface BreakfastItem {
  _id?: string
  name: string
  description?: string
  price: number
  points?: number
  categoryId: ObjectId | string
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
  categoryId: string | ObjectId
  image?: string
  isAvailable?: boolean
  isRequired?: boolean
  minQuantity?: number
  maxQuantity?: number
  availableSupplements?: BreakfastSupplementConfig[]
}

function normalizeSupplementId(supp: BreakfastSupplementConfig): BreakfastSupplementConfig {
  return {
    ...supp,
    supplementId: typeof supp.supplementId === 'string' && ObjectId.isValid(supp.supplementId)
      ? new ObjectId(supp.supplementId)
      : supp.supplementId
  }
}

function toBreakfastItem(doc: WithId<Document> | null): BreakfastItem | null {
  if (!doc) return null

  // Convert ObjectId supplementId back to string for frontend
  let availableSupplements = doc.availableSupplements || []
  if (Array.isArray(availableSupplements)) {
    availableSupplements = availableSupplements.map((supp: any) => ({
      ...supp,
      supplementId: supp.supplementId instanceof ObjectId 
        ? supp.supplementId.toString() 
        : supp.supplementId
    }))
  }

  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    points: doc.points,
    categoryId: doc.categoryId instanceof ObjectId ? doc.categoryId.toString() : doc.categoryId,
    image: doc.image,
    isAvailable: doc.isAvailable ?? true,
    isRequired: doc.isRequired,
    minQuantity: doc.minQuantity,
    maxQuantity: doc.maxQuantity,
    availableSupplements: availableSupplements,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const BreakfastItemModel = {
  collection: 'breakfast_items',

  async create(input: CreateBreakfastItemInput): Promise<BreakfastItem> {
    const db = getDB()
    const now = new Date()

    const categoryIdObj = typeof input.categoryId === 'string' 
      ? new ObjectId(input.categoryId) 
      : input.categoryId

    // Convert supplement IDs to ObjectId
    let availableSupplements = undefined
    if (input.availableSupplements && Array.isArray(input.availableSupplements)) {
      availableSupplements = input.availableSupplements.map(supp => ({
        ...supp,
        supplementId: typeof supp.supplementId === 'string' && ObjectId.isValid(supp.supplementId)
          ? new ObjectId(supp.supplementId)
          : supp.supplementId
      }))
    }

    const newItem: Omit<BreakfastItem, '_id'> = {
      name: input.name,
      description: input.description,
      price: input.price,
      points: input.points,
      categoryId: categoryIdObj,
      image: input.image,
      isAvailable: input.isAvailable !== false,
      isRequired: input.isRequired,
      minQuantity: input.minQuantity,
      maxQuantity: input.maxQuantity,
      availableSupplements: availableSupplements,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection(this.collection).insertOne(newItem)
    return { 
      _id: result.insertedId.toString(), 
      ...newItem,
      categoryId: categoryIdObj.toString(),
      availableSupplements: input.availableSupplements // Return original string IDs
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
    if (!ObjectId.isValid(id)) {
      throw new Error('ID invalide')
    }

    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    
    const updateData: any = { updatedAt: new Date() }
    
    if (safeUpdates.name !== undefined) updateData.name = safeUpdates.name
    if (safeUpdates.description !== undefined) updateData.description = safeUpdates.description
    if (safeUpdates.price !== undefined) updateData.price = safeUpdates.price
    if (safeUpdates.points !== undefined) updateData.points = safeUpdates.points
    if (safeUpdates.image !== undefined) updateData.image = safeUpdates.image
    if (safeUpdates.isAvailable !== undefined) updateData.isAvailable = safeUpdates.isAvailable
    if (safeUpdates.isRequired !== undefined) updateData.isRequired = safeUpdates.isRequired
    if (safeUpdates.minQuantity !== undefined) updateData.minQuantity = safeUpdates.minQuantity
    if (safeUpdates.maxQuantity !== undefined) updateData.maxQuantity = safeUpdates.maxQuantity
    
    // Convert supplement IDs to ObjectId for storage
    if (safeUpdates.availableSupplements !== undefined) {
      if (Array.isArray(safeUpdates.availableSupplements)) {
        updateData.availableSupplements = safeUpdates.availableSupplements.map((supp: any) => ({
          ...supp,
          supplementId: typeof supp.supplementId === 'string' && ObjectId.isValid(supp.supplementId)
            ? new ObjectId(supp.supplementId)
            : supp.supplementId
        }))
      } else {
        updateData.availableSupplements = safeUpdates.availableSupplements
      }
    }
    
    if (safeUpdates.categoryId !== undefined && safeUpdates.categoryId !== null) {
      updateData.categoryId = typeof safeUpdates.categoryId === 'string' 
        ? new ObjectId(safeUpdates.categoryId) 
        : safeUpdates.categoryId
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