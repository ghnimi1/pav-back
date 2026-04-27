import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export type StorageLocationType = 'refrigerator' | 'freezer' | 'room' | 'shelf' | 'other'

export interface StorageLocation {
  _id?: string
  id?: string
  name: string
  type: StorageLocationType
  description?: string
  temperature?: string
  capacity?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

function toStorageLocation(doc: WithId<Document> | null): StorageLocation | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    description: doc.description,
    temperature: doc.temperature,
    capacity: doc.capacity,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const StorageLocationModel = {
  collection: 'storage_locations',

  async create(input: Omit<StorageLocation, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageLocation> {
    const db = getDB()
    const now = new Date()
    const newLocation: Omit<StorageLocation, '_id'> = {
      ...input,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    const result = await db.collection('storage_locations').insertOne(newLocation)
    return { _id: result.insertedId.toString(), ...newLocation }
  },

  async findAll(): Promise<StorageLocation[]> {
    const db = getDB()
    const docs = await db.collection('storage_locations').find({}).sort({ name: 1 }).toArray()
    return docs.map(doc => toStorageLocation(doc)!).filter(Boolean)
  },

  async findById(id: string): Promise<StorageLocation | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('storage_locations').findOne({ _id: new ObjectId(id) })
    return toStorageLocation(doc)
  },

  async update(id: string, updates: Partial<StorageLocation>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates as any
    await db.collection('storage_locations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },

  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('storage_locations').deleteOne({ _id: new ObjectId(id) })
  }
}
