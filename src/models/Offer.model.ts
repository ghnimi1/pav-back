import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface OfferSchedule {
  daysOfWeek: number[]
  startTime: string
  endTime: string
}

export interface OfferItem {
  itemId: string
  quantity: number
}

export interface Offer {
  _id?: string
  id?: string
  name: string
  description: string
  image?: string
  originalPrice: number
  discountedPrice: number
  points: number
  items: OfferItem[]
  schedule: OfferSchedule
  isActive: boolean
  validFrom?: Date
  validUntil?: Date
  maxPerDay?: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateOfferInput {
  name: string
  description: string
  image?: string
  originalPrice: number
  discountedPrice: number
  points: number
  items: OfferItem[]
  schedule: OfferSchedule
  isActive?: boolean
  validFrom?: Date
  validUntil?: Date
  maxPerDay?: number
}

function toOffer(doc: WithId<Document> | null): Offer | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    image: doc.image,
    originalPrice: doc.originalPrice,
    discountedPrice: doc.discountedPrice,
    points: doc.points,
    items: doc.items,
    schedule: doc.schedule,
    isActive: doc.isActive ?? true,
    validFrom: doc.validFrom,
    validUntil: doc.validUntil,
    maxPerDay: doc.maxPerDay,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const OfferModel = {
  collection: 'offers',
  
  async create(input: CreateOfferInput): Promise<Offer> {
    const db = getDB()
    const now = new Date()
    
    const newOffer: Omit<Offer, '_id'> = {
      name: input.name,
      description: input.description,
      image: input.image,
      originalPrice: input.originalPrice,
      discountedPrice: input.discountedPrice,
      points: input.points,
      items: input.items,
      schedule: input.schedule,
      isActive: input.isActive !== false,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      maxPerDay: input.maxPerDay,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('offers').insertOne(newOffer)
    return { _id: result.insertedId.toString(), ...newOffer }
  },
  
  async findAll(): Promise<Offer[]> {
    const db = getDB()
    const docs = await db.collection('offers')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    return docs.map(doc => toOffer(doc)!).filter(o => o !== null)
  },
  
  async findActive(): Promise<Offer[]> {
    const db = getDB()
    const now = new Date()
    const docs = await db.collection('offers')
      .find({ 
        isActive: true,
        $or: [
          { validUntil: { $exists: false } },
          { validUntil: { $gt: now } }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray()
    return docs.map(doc => toOffer(doc)!).filter(o => o !== null)
  },
  
  async findCurrent(): Promise<Offer[]> {
    const db = getDB()
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    const docs = await db.collection('offers')
      .find({ isActive: true })
      .toArray()
    
    return docs
      .filter(doc => {
        if (doc.validFrom && new Date(doc.validFrom) > now) return false
        if (doc.validUntil && new Date(doc.validUntil) < now) return false
        if (!doc.schedule?.daysOfWeek?.includes(currentDay)) return false
        if (currentTime < doc.schedule.startTime || currentTime > doc.schedule.endTime) return false
        return true
      })
      .map(doc => toOffer(doc)!)
      .filter(o => o !== null)
  },
  
  async findById(id: string): Promise<Offer | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('offers').findOne({ _id: new ObjectId(id) })
    return toOffer(doc)
  },
  
  async update(id: string, updates: Partial<Offer>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    await db.collection('offers').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('offers').deleteOne({ _id: new ObjectId(id) })
  }
}