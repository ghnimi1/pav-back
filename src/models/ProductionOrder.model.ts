// backend/src/models/ProductionOrder.model.ts

import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export type ProductionStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled'

export interface ProductionOrder {
  _id?: string
  recipeId: string
  showcaseId: string
  quantity: number
  scheduledDate: Date
  scheduledTime?: string
  status: ProductionStatus
  producedBy?: string
  startedAt?: Date
  completedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

function toProductionOrder(doc: WithId<Document> | null): ProductionOrder | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    recipeId: doc.recipeId,
    showcaseId: doc.showcaseId,
    quantity: doc.quantity,
    scheduledDate: doc.scheduledDate,
    scheduledTime: doc.scheduledTime,
    status: doc.status,
    producedBy: doc.producedBy,
    startedAt: doc.startedAt,
    completedAt: doc.completedAt,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const ProductionOrderModel = {
  collection: 'production_orders',
  
  async create(input: any): Promise<ProductionOrder> {
    const db = getDB()
    const now = new Date()
    const newOrder: Omit<ProductionOrder, '_id'> = {
      recipeId: input.recipeId,
      showcaseId: input.showcaseId,
      quantity: input.quantity,
      scheduledDate: new Date(input.scheduledDate),
      scheduledTime: input.scheduledTime,
      status: input.status || 'planned',
      notes: input.notes,
      createdAt: now,
      updatedAt: now
    }
    const result = await db.collection('production_orders').insertOne(newOrder)
    return { _id: result.insertedId.toString(), ...newOrder }
  },
  
  async findAll(): Promise<ProductionOrder[]> {
    const db = getDB()
    const docs = await db.collection('production_orders').find({}).toArray()
    return docs.map(doc => toProductionOrder(doc)!).filter(o => o !== null)
  },
  
  async findByStatus(status: ProductionStatus): Promise<ProductionOrder[]> {
    const db = getDB()
    const docs = await db.collection('production_orders')
      .find({ status })
      .toArray()
    return docs.map(doc => toProductionOrder(doc)!).filter(o => o !== null)
  },
  
  async findByRecipe(recipeId: string): Promise<ProductionOrder[]> {
    const db = getDB()
    const docs = await db.collection('production_orders')
      .find({ recipeId })
      .toArray()
    return docs.map(doc => toProductionOrder(doc)!).filter(o => o !== null)
  },
  
  async findById(id: string): Promise<ProductionOrder | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('production_orders').findOne({ _id: new ObjectId(id) })
    return toProductionOrder(doc)
  },
  
  async update(id: string, updates: Partial<ProductionOrder>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    await db.collection('production_orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('production_orders').deleteOne({ _id: new ObjectId(id) })
  },
  
  async startProduction(id: string, employeeId: string): Promise<void> {
    await this.update(id, {
      status: 'in-progress',
      producedBy: employeeId,
      startedAt: new Date()
    })
  },
  
  async completeProduction(id: string): Promise<void> {
    await this.update(id, {
      status: 'completed',
      completedAt: new Date()
    })
  },
  
  async cancelProduction(id: string): Promise<void> {
    await this.update(id, { status: 'cancelled' })
  }
}