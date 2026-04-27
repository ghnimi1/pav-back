import { getDB } from '../config/database'
import { ObjectId, type Document, type WithId } from 'mongodb'

export type RewardType = 'discount' | 'free_item' | 'special'

export interface Reward {
  _id?: string
  id?: string
  name: string
  description: string
  pointsCost: number
  type: RewardType
  value: string
  image?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateRewardInput {
  name: string
  description: string
  pointsCost: number
  type: RewardType
  value: string
  image?: string
  isActive?: boolean
}

function toReward(doc: WithId<Document> | null): Reward | null {
  if (!doc) return null

  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    pointsCost: doc.pointsCost,
    type: doc.type,
    value: doc.value,
    image: doc.image,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const RewardModel = {
  collection: 'rewards',

  async create(input: CreateRewardInput): Promise<Reward> {
    const db = getDB()
    const now = new Date()

    const newReward: Omit<Reward, '_id'> = {
      name: input.name,
      description: input.description,
      pointsCost: input.pointsCost,
      type: input.type,
      value: input.value,
      image: input.image,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection('rewards').insertOne(newReward)
    return { _id: result.insertedId.toString(), ...newReward }
  },

  async findAll(): Promise<Reward[]> {
    const db = getDB()
    const docs = await db.collection('rewards').find({}).sort({ createdAt: -1 }).toArray()
    return docs.map((doc) => toReward(doc)!).filter((reward) => reward !== null)
  },

  async findActive(): Promise<Reward[]> {
    const db = getDB()
    const docs = await db.collection('rewards').find({ isActive: true }).sort({ createdAt: -1 }).toArray()
    return docs.map((doc) => toReward(doc)!).filter((reward) => reward !== null)
  },

  async findById(id: string): Promise<Reward | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('rewards').findOne({ _id: new ObjectId(id) })
    return toReward(doc)
  },

  async update(id: string, updates: Partial<Reward>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates

    await db.collection('rewards').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },

  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('rewards').deleteOne({ _id: new ObjectId(id) })
  },
}
