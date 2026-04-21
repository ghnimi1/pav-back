// backend/src/models/Showcase.model.ts

import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export type ShowcaseType = 'refrigerated' | 'ambient' | 'frozen' | 'heated'

export interface Showcase {
  _id?: string
  name: string
  type: ShowcaseType
  temperature?: string
  capacity?: number
  location: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

function toShowcase(doc: WithId<Document> | null): Showcase | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    temperature: doc.temperature,
    capacity: doc.capacity,
    location: doc.location,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const ShowcaseModel = {
  collection: 'showcases',
  
  async create(input: any): Promise<Showcase> {
    const db = getDB()
    const now = new Date()
    const newShowcase: Omit<Showcase, '_id'> = {
      name: input.name,
      type: input.type,
      temperature: input.temperature,
      capacity: input.capacity,
      location: input.location,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    const result = await db.collection('showcases').insertOne(newShowcase)
    return { _id: result.insertedId.toString(), ...newShowcase }
  },
  
  async findAll(): Promise<Showcase[]> {
    const db = getDB()
    const docs = await db.collection('showcases').find({}).toArray()
    return docs.map(doc => toShowcase(doc)!).filter(s => s !== null)
  },
  
  async findActive(): Promise<Showcase[]> {
    const db = getDB()
    const docs = await db.collection('showcases')
      .find({ isActive: true })
      .toArray()
    return docs.map(doc => toShowcase(doc)!).filter(s => s !== null)
  },
  
  async findById(id: string): Promise<Showcase | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('showcases').findOne({ _id: new ObjectId(id) })
    return toShowcase(doc)
  },
  
  async update(id: string, updates: Partial<Showcase>): Promise<void> {
    const db = getDB()
    await db.collection('showcases').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('showcases').deleteOne({ _id: new ObjectId(id) })
  }
}