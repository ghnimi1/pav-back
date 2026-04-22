// backend/src/models/ShowcaseItem.model.ts

import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export type ShowcaseItemStatus = 'available' | 'low' | 'expired' | 'sold-out'

export interface ShowcaseItem {
  _id?: string
  recipeId: string
  productionOrderId: string
  showcaseId: string
  batchNumber: string
  quantity: number
  initialQuantity: number
  productionDate: Date
  productionTime: string
  expirationDate: Date
  expirationTime: string
  unitCost: number
  sellingPrice: number
  status: ShowcaseItemStatus
  createdAt: Date
  updatedAt: Date
}

function toShowcaseItem(doc: WithId<Document> | null): ShowcaseItem | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    recipeId: doc.recipeId,
    productionOrderId: doc.productionOrderId,
    showcaseId: doc.showcaseId,
    batchNumber: doc.batchNumber,
    quantity: doc.quantity,
    initialQuantity: doc.initialQuantity,
    productionDate: doc.productionDate,
    productionTime: doc.productionTime,
    expirationDate: doc.expirationDate,
    expirationTime: doc.expirationTime,
    unitCost: doc.unitCost,
    sellingPrice: doc.sellingPrice,
    status: doc.status || 'available',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const ShowcaseItemModel = {
  collection: 'showcase_items',
  
  async create(input: any): Promise<ShowcaseItem> {
    const db = getDB()
    const now = new Date()
    const newItem: Omit<ShowcaseItem, '_id'> = {
      recipeId: input.recipeId,
      productionOrderId: input.productionOrderId,
      showcaseId: input.showcaseId,
      batchNumber: input.batchNumber,
      quantity: input.quantity,
      initialQuantity: input.initialQuantity,
      productionDate: new Date(input.productionDate),
      productionTime: input.productionTime,
      expirationDate: new Date(input.expirationDate),
      expirationTime: input.expirationTime,
      unitCost: input.unitCost,
      sellingPrice: input.sellingPrice,
      status: 'available',
      createdAt: now,
      updatedAt: now
    }
    const result = await db.collection('showcase_items').insertOne(newItem)
    return { _id: result.insertedId.toString(), ...newItem }
  },
  
  async findByShowcase(showcaseId: string): Promise<ShowcaseItem[]> {
    const db = getDB()
    const docs = await db.collection('showcase_items')
      .find({ showcaseId })
      .sort({ productionDate: 1 })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)!).filter(i => i !== null)
  },
  
  async findAvailable(showcaseId?: string): Promise<ShowcaseItem[]> {
    const db = getDB()
    const now = new Date()
    const query: any = { quantity: { $gt: 0 }, expirationDate: { $gt: now } }
    if (showcaseId) query.showcaseId = showcaseId
    const docs = await db.collection('showcase_items')
      .find(query)
      .sort({ productionDate: 1 })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)!).filter(i => i !== null)
  },
  
  async findExpiringSoon(hours: number = 4): Promise<ShowcaseItem[]> {
    const db = getDB()
    const now = new Date()
    const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000)
    const docs = await db.collection('showcase_items')
      .find({ quantity: { $gt: 0 }, expirationDate: { $gte: now, $lte: threshold } })
      .sort({ expirationDate: 1 })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)!).filter(i => i !== null)
  },
  
  async findLowStock(): Promise<ShowcaseItem[]> {
    const db = getDB()
    const docs = await db.collection('showcase_items')
      .find({
        quantity: { $gt: 0 },
        $expr: { $lt: ['$quantity', { $multiply: ['$initialQuantity', 0.2] }] }
      })
      .toArray()
    return docs.map(doc => toShowcaseItem(doc)!).filter(i => i !== null)
  },
  
  async findById(id: string): Promise<ShowcaseItem | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('showcase_items').findOne({ _id: new ObjectId(id) })
    return toShowcaseItem(doc)
  },
  
  async update(id: string, updates: Partial<ShowcaseItem>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    await db.collection('showcase_items').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },
  
  async decrementStock(id: string, quantity: number): Promise<void> {
    const item = await this.findById(id)
    if (!item) throw new Error('Showcase item not found')
    const newQuantity = item.quantity - quantity
    let status: ShowcaseItemStatus = 'available'
    if (newQuantity <= 0) status = 'sold-out'
    else if (newQuantity < item.initialQuantity * 0.2) status = 'low'
    await this.update(id, { quantity: newQuantity, status })
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('showcase_items').deleteOne({ _id: new ObjectId(id) })
  }
}