import { getDB } from '../config/database'
import { ObjectId, type Document, type WithId } from 'mongodb'

export type BreakfastFormulaType = 'normal' | 'healthy'

export interface BreakfastFormula {
  _id?: string
  name: string
  description: string
  price: number
  points?: number
  type: BreakfastFormulaType
  image?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateBreakfastFormulaInput {
  name: string
  description: string
  price: number
  points?: number
  type: BreakfastFormulaType
  image?: string
  isActive?: boolean
}

function toBreakfastFormula(doc: WithId<Document> | null): BreakfastFormula | null {
  if (!doc) return null

  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    points: doc.points,
    type: doc.type,
    image: doc.image,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const BreakfastFormulaModel = {
  collection: 'breakfast_formulas',

  async create(input: CreateBreakfastFormulaInput): Promise<BreakfastFormula> {
    const db = getDB()
    const now = new Date()

    const newFormula: Omit<BreakfastFormula, '_id'> = {
      name: input.name,
      description: input.description,
      price: input.price,
      points: input.points,
      type: input.type,
      image: input.image,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection(this.collection).insertOne(newFormula)
    return { _id: result.insertedId.toString(), ...newFormula }
  },

  async findAll(): Promise<BreakfastFormula[]> {
    const db = getDB()
    const docs = await db.collection(this.collection).find({}).sort({ type: 1 }).toArray()
    return docs.map((doc) => toBreakfastFormula(doc)!).filter(Boolean)
  },

  async findActive(): Promise<BreakfastFormula[]> {
    const db = getDB()
    const docs = await db.collection(this.collection).find({ isActive: true }).sort({ type: 1 }).toArray()
    return docs.map((doc) => toBreakfastFormula(doc)!).filter(Boolean)
  },

  async findById(id: string): Promise<BreakfastFormula | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection(this.collection).findOne({ _id: new ObjectId(id) })
    return toBreakfastFormula(doc)
  },

  async findByType(type: BreakfastFormulaType): Promise<BreakfastFormula | null> {
    const db = getDB()
    const doc = await db.collection(this.collection).findOne({ type })
    return toBreakfastFormula(doc)
  },

  async update(id: string, updates: Partial<BreakfastFormula>): Promise<void> {
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
}
