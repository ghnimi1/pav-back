import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface Batch {
  _id?: string
  productId: string
  supplierId?: string
  locationId?: string
  batchNumber: string
  quantity: number
  unitCost: number
  receptionDate: Date
  productionDate?: Date
  expirationDate: Date
  openingDate?: Date
  expirationAfterOpening?: Date
  isOpened: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateBatchInput {
  productId: string
  supplierId?: string
  locationId?: string
  batchNumber: string
  quantity: number
  unitCost: number
  receptionDate: Date | string
  productionDate?: Date | string
  expirationDate: Date | string
  notes?: string
}

// Helper functions for type conversion
function toBatch(doc: WithId<Document> | null): Batch | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    productId: doc.productId,
    supplierId: doc.supplierId,
    locationId: doc.locationId,
    batchNumber: doc.batchNumber,
    quantity: doc.quantity,
    unitCost: doc.unitCost,
    receptionDate: doc.receptionDate,
    productionDate: doc.productionDate,
    expirationDate: doc.expirationDate,
    openingDate: doc.openingDate,
    expirationAfterOpening: doc.expirationAfterOpening,
    isOpened: doc.isOpened || false,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

function toBatches(docs: WithId<Document>[]): Batch[] {
  return docs.map(doc => toBatch(doc)!).filter((b): b is Batch => b !== null)
}

export const BatchModel = {
  collection: 'batches',
  
  async create(input: CreateBatchInput): Promise<Batch> {
    const db = getDB()
    const now = new Date()
    
    const newBatch: Omit<Batch, '_id'> = {
      productId: input.productId,
      supplierId: input.supplierId,
      locationId: input.locationId,
      batchNumber: input.batchNumber,
      quantity: input.quantity,
      unitCost: input.unitCost,
      receptionDate: new Date(input.receptionDate),
      productionDate: input.productionDate ? new Date(input.productionDate) : undefined,
      expirationDate: new Date(input.expirationDate),
      isOpened: false,
      notes: input.notes,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('batches').insertOne(newBatch)
    return { _id: result.insertedId.toString(), ...newBatch }
  },
  
  async findByProduct(productId: string): Promise<Batch[]> {
    const db = getDB()
    const docs = await db.collection('batches')
      .find({ productId })
      .sort({ receptionDate: 1 }) // FIFO: oldest first
      .toArray()
    return toBatches(docs)
  },
  
  async findActiveByProduct(productId: string): Promise<Batch[]> {
    const db = getDB()
    const now = new Date()
    const docs = await db.collection('batches')
      .find({ 
        productId, 
        quantity: { $gt: 0 },
        expirationDate: { $gt: now }
      })
      .sort({ receptionDate: 1 })
      .toArray()
    return toBatches(docs)
  },
  
  async findExpiredByProduct(productId: string): Promise<Batch[]> {
    const db = getDB()
    const now = new Date()
    const docs = await db.collection('batches')
      .find({ 
        productId, 
        expirationDate: { $lt: now }
      })
      .sort({ expirationDate: 1 })
      .toArray()
    return toBatches(docs)
  },
  
  async findById(id: string): Promise<Batch | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('batches').findOne({ _id: new ObjectId(id) })
    return toBatch(doc)
  },
  
  async findByBatchNumber(batchNumber: string): Promise<Batch | null> {
    const db = getDB()
    const doc = await db.collection('batches').findOne({ batchNumber })
    return toBatch(doc)
  },
  
  async update(id: string, updates: Partial<Batch>): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    
    const { _id, ...updateData } = updates as any
    
    await db.collection('batches').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    await db.collection('batches').deleteOne({ _id: new ObjectId(id) })
  },
  
  async openBatch(id: string, openingDate: Date, newExpirationDate?: Date): Promise<void> {
    await this.update(id, {
      isOpened: true,
      openingDate,
      expirationAfterOpening: newExpirationDate
    })
  },
  
  async consumeFIFO(productId: string, quantity: number): Promise<boolean> {
    const batches = await this.findActiveByProduct(productId)
    let remaining = quantity
    
    for (const batch of batches) {
      if (remaining <= 0) break
      
      const consume = Math.min(batch.quantity, remaining)
      const newQuantity = batch.quantity - consume
      remaining -= consume
      
      await this.update(batch._id!, { quantity: newQuantity })
    }
    
    return remaining === 0
  },
  
  async getExpiringSoon(daysThreshold: number = 30): Promise<Batch[]> {
    const db = getDB()
    const now = new Date()
    const threshold = new Date()
    threshold.setDate(threshold.getDate() + daysThreshold)
    
    const docs = await db.collection('batches')
      .find({
        quantity: { $gt: 0 },
        expirationDate: { $gte: now, $lte: threshold }
      })
      .sort({ expirationDate: 1 })
      .toArray()
    return toBatches(docs)
  },
  
  async getTotalValue(): Promise<number> {
    const db = getDB()
    const batches = await db.collection('batches')
      .find({ quantity: { $gt: 0 } })
      .toArray()
    return batches.reduce((sum, b) => sum + (b.quantity * b.unitCost), 0)
  },
  
  async countByProduct(productId: string): Promise<number> {
    const db = getDB()
    return await db.collection('batches').countDocuments({ productId })
  },
  
  async getLowStockBatches(minQuantity: number = 5): Promise<Batch[]> {
    const db = getDB()
    const docs = await db.collection('batches')
      .find({ 
        quantity: { $gt: 0, $lte: minQuantity }
      })
      .sort({ quantity: 1 })
      .toArray()
    return toBatches(docs)
  },
  
  async getStockStatsByProduct(productId: string): Promise<{
    totalQuantity: number
    totalValue: number
    batchCount: number
    avgUnitCost: number
  }> {
    const batches = await this.findByProduct(productId)
    const activeBatches = batches.filter(b => b.quantity > 0)
    
    const totalQuantity = activeBatches.reduce((sum, b) => sum + b.quantity, 0)
    const totalValue = activeBatches.reduce((sum, b) => sum + (b.quantity * b.unitCost), 0)
    
    return {
      totalQuantity,
      totalValue,
      batchCount: activeBatches.length,
      avgUnitCost: totalQuantity > 0 ? totalValue / totalQuantity : 0
    }
  }
}