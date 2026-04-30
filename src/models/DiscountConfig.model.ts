import { ObjectId, type Document, type WithId } from 'mongodb'
import { getDB } from '../config/database'

export interface DiscountTier {
  id: string
  minAmount: number
  maxAmount: number
  percent: number
  name: string
  color: string
  isActive: boolean
}

export interface DiscountConfig {
  _id?: string
  isEnabled: boolean
  minItemsForDiscount: number
  tiers: DiscountTier[]
  updatedAt: Date
}

export interface DiscountConfigInput {
  isEnabled?: boolean
  minItemsForDiscount?: number
  tiers?: DiscountTier[]
}

const DEFAULT_DISCOUNT_TIERS: DiscountTier[] = [
  { id: 'tier-1', minAmount: 10, maxAmount: 19.99, percent: 5, name: 'Decouverte', color: 'bg-emerald-500', isActive: true },
  { id: 'tier-2', minAmount: 20, maxAmount: 29.99, percent: 8, name: 'Gourmand', color: 'bg-blue-500', isActive: true },
  { id: 'tier-3', minAmount: 30, maxAmount: 44.99, percent: 10, name: 'Genereux', color: 'bg-purple-500', isActive: true },
  { id: 'tier-4', minAmount: 45, maxAmount: 59.99, percent: 12, name: 'Premium', color: 'bg-amber-500', isActive: true },
  { id: 'tier-5', minAmount: 60, maxAmount: 99.99, percent: 15, name: 'VIP', color: 'bg-rose-500', isActive: true },
  { id: 'tier-6', minAmount: 100, maxAmount: 999999, percent: 18, name: 'Excellence', color: 'bg-gradient-to-r from-amber-500 to-rose-500', isActive: true },
]

const DEFAULT_DISCOUNT_CONFIG: Omit<DiscountConfig, '_id'> = {
  isEnabled: true,
  minItemsForDiscount: 2,
  tiers: DEFAULT_DISCOUNT_TIERS,
  updatedAt: new Date(),
}

function toDiscountConfig(doc: WithId<Document> | null): DiscountConfig {
  if (!doc) {
    return { ...DEFAULT_DISCOUNT_CONFIG, updatedAt: new Date() }
  }

  return {
    _id: doc._id.toString(),
    isEnabled: doc.isEnabled !== false,
    minItemsForDiscount: Number(doc.minItemsForDiscount || DEFAULT_DISCOUNT_CONFIG.minItemsForDiscount),
    tiers: Array.isArray(doc.tiers) ? doc.tiers : DEFAULT_DISCOUNT_CONFIG.tiers,
    updatedAt: doc.updatedAt ?? new Date(),
  }
}

export const DiscountConfigModel = {
  collection: 'discount_configs',

  async get(): Promise<DiscountConfig> {
    const db = getDB()
    const doc = await db.collection(this.collection).findOne({})
    if (!doc) {
      const defaultConfig = { ...DEFAULT_DISCOUNT_CONFIG, updatedAt: new Date() }
      const result = await db.collection(this.collection).insertOne(defaultConfig)
      return { _id: result.insertedId.toString(), ...defaultConfig }
    }
    return toDiscountConfig(doc)
  },

  async update(updates: DiscountConfigInput): Promise<DiscountConfig> {
    const db = getDB()
    const current = await this.get()
    const nextConfig = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    }

    if (current._id && ObjectId.isValid(current._id)) {
      const { _id, ...persistedConfig } = nextConfig
      await db.collection(this.collection).updateOne(
        { _id: new ObjectId(current._id) },
        { $set: persistedConfig }
      )
      return { ...nextConfig, _id: current._id }
    }

    const { _id, ...insertable } = nextConfig
    const result = await db.collection(this.collection).insertOne(insertable)
    return { _id: result.insertedId.toString(), ...insertable }
  },
}
