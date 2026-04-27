import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export type SupplierStatus = 'active' | 'inactive'

export interface Supplier {
  _id?: string
  id?: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  status: SupplierStatus
  createdAt: Date
  updatedAt: Date
}

function toSupplier(doc: WithId<Document> | null): Supplier | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    contactName: doc.contactName,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    notes: doc.notes,
    status: doc.status || 'active',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const SupplierModel = {
  collection: 'suppliers',

  async create(input: Omit<Supplier, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const db = getDB()
    const now = new Date()
    const newSupplier: Omit<Supplier, '_id'> = {
      ...input,
      status: input.status || 'active',
      createdAt: now,
      updatedAt: now
    }
    const result = await db.collection('suppliers').insertOne(newSupplier)
    return { _id: result.insertedId.toString(), ...newSupplier }
  },

  async findAll(): Promise<Supplier[]> {
    const db = getDB()
    const docs = await db.collection('suppliers').find({}).sort({ name: 1 }).toArray()
    return docs.map(doc => toSupplier(doc)!).filter(Boolean)
  },

  async findById(id: string): Promise<Supplier | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('suppliers').findOne({ _id: new ObjectId(id) })
    return toSupplier(doc)
  },

  async update(id: string, updates: Partial<Supplier>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates as any
    await db.collection('suppliers').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },

  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('suppliers').deleteOne({ _id: new ObjectId(id) })
  }
}
