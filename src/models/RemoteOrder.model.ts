import { ObjectId, type Document, type WithId } from 'mongodb'
import { getDB } from '../config/database'

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled'
export type DeliveryMode = 'delivery' | 'pickup'
export type PaymentMethod = 'cash_on_delivery' | 'cash_on_pickup'

export interface OrderItemSupplement {
  name: string
  price: number
}

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  points?: number
  supplements?: OrderItemSupplement[]
  note?: string
}

export interface DeliveryAddress {
  fullName: string
  phone: string
  address: string
  city: string
  postalCode?: string
  instructions?: string
}

export interface RemoteOrder {
  _id?: string
  id?: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  totalPoints: number
  status: OrderStatus
  deliveryMode: DeliveryMode
  paymentMethod: PaymentMethod
  deliveryAddress?: DeliveryAddress
  pickupTime?: string
  estimatedTime: number
  createdAt: Date
  confirmedAt?: Date
  readyAt?: Date
  completedAt?: Date
  cancelledAt?: Date
  cancelReason?: string
  clientId?: string
  clientEmail?: string
  clientName?: string
  clientPhone?: string
  confirmedBy?: string
  completedBy?: string
  customerNote?: string
  staffNote?: string
}

export interface CreateRemoteOrderInput {
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  totalPoints: number
  deliveryMode: DeliveryMode
  paymentMethod: PaymentMethod
  deliveryAddress?: DeliveryAddress
  pickupTime?: string
  estimatedTime: number
  clientId?: string
  clientEmail?: string
  clientName?: string
  clientPhone?: string
  customerNote?: string
}

export interface DeliveryConfig {
  _id?: string
  deliveryEnabled: boolean
  pickupEnabled: boolean
  deliveryFee: number
  freeDeliveryThreshold: number
  estimatedDeliveryTime: number
  estimatedPickupTime: number
  deliveryZones: string[]
  minOrderAmount: number
  maxDeliveryDistance?: number
  updatedAt: Date
}

export interface DeliveryConfigInput {
  deliveryEnabled?: boolean
  pickupEnabled?: boolean
  deliveryFee?: number
  freeDeliveryThreshold?: number
  estimatedDeliveryTime?: number
  estimatedPickupTime?: number
  deliveryZones?: string[]
  minOrderAmount?: number
  maxDeliveryDistance?: number
}

const DEFAULT_DELIVERY_CONFIG: Omit<DeliveryConfig, '_id'> = {
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFee: 5,
  freeDeliveryThreshold: 50,
  estimatedDeliveryTime: 45,
  estimatedPickupTime: 20,
  deliveryZones: ['Tunis', 'Ariana', 'Ben Arous', 'Manouba'],
  minOrderAmount: 15,
  maxDeliveryDistance: undefined,
  updatedAt: new Date(),
}

function toRemoteOrder(doc: WithId<Document> | null): RemoteOrder | null {
  if (!doc) return null

  return {
    _id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    items: doc.items || [],
    subtotal: doc.subtotal,
    deliveryFee: doc.deliveryFee,
    total: doc.total,
    totalPoints: doc.totalPoints || 0,
    status: doc.status,
    deliveryMode: doc.deliveryMode,
    paymentMethod: doc.paymentMethod,
    deliveryAddress: doc.deliveryAddress,
    pickupTime: doc.pickupTime,
    estimatedTime: doc.estimatedTime,
    createdAt: doc.createdAt,
    confirmedAt: doc.confirmedAt,
    readyAt: doc.readyAt,
    completedAt: doc.completedAt,
    cancelledAt: doc.cancelledAt,
    cancelReason: doc.cancelReason,
    clientId: doc.clientId,
    clientEmail: doc.clientEmail,
    clientName: doc.clientName,
    clientPhone: doc.clientPhone,
    confirmedBy: doc.confirmedBy,
    completedBy: doc.completedBy,
    customerNote: doc.customerNote,
    staffNote: doc.staffNote,
  }
}

function toDeliveryConfig(doc: WithId<Document> | null): DeliveryConfig {
  if (!doc) {
    return { ...DEFAULT_DELIVERY_CONFIG, updatedAt: new Date() }
  }

  return {
    _id: doc._id.toString(),
    deliveryEnabled: doc.deliveryEnabled !== false,
    pickupEnabled: doc.pickupEnabled !== false,
    deliveryFee: doc.deliveryFee ?? DEFAULT_DELIVERY_CONFIG.deliveryFee,
    freeDeliveryThreshold: doc.freeDeliveryThreshold ?? DEFAULT_DELIVERY_CONFIG.freeDeliveryThreshold,
    estimatedDeliveryTime: doc.estimatedDeliveryTime ?? DEFAULT_DELIVERY_CONFIG.estimatedDeliveryTime,
    estimatedPickupTime: doc.estimatedPickupTime ?? DEFAULT_DELIVERY_CONFIG.estimatedPickupTime,
    deliveryZones: Array.isArray(doc.deliveryZones) ? doc.deliveryZones : DEFAULT_DELIVERY_CONFIG.deliveryZones,
    minOrderAmount: doc.minOrderAmount ?? DEFAULT_DELIVERY_CONFIG.minOrderAmount,
    maxDeliveryDistance: doc.maxDeliveryDistance,
    updatedAt: doc.updatedAt ?? new Date(),
  }
}

export const RemoteOrderModel = {
  collection: 'remote_orders',

  async create(input: CreateRemoteOrderInput): Promise<RemoteOrder> {
    const db = getDB()
    const now = new Date()
    const newOrder: Omit<RemoteOrder, '_id'> = {
      ...input,
      status: 'new',
      createdAt: now,
    }

    const result = await db.collection(this.collection).insertOne(newOrder)
    return { _id: result.insertedId.toString(), ...newOrder }
  },

  async findAll(): Promise<RemoteOrder[]> {
    const db = getDB()
    const docs = await db.collection(this.collection).find({}).sort({ createdAt: -1 }).toArray()
    return docs.map((doc) => toRemoteOrder(doc)!).filter(Boolean)
  },

  async findByClientEmail(clientEmail: string): Promise<RemoteOrder[]> {
    const db = getDB()
    const docs = await db.collection(this.collection).find({ clientEmail }).sort({ createdAt: -1 }).toArray()
    return docs.map((doc) => toRemoteOrder(doc)!).filter(Boolean)
  },

  async findById(id: string): Promise<RemoteOrder | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection(this.collection).findOne({ _id: new ObjectId(id) })
    return toRemoteOrder(doc)
  },

  async update(id: string, updates: Partial<RemoteOrder>): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')

    const { _id, id: ignoredId, ...safeUpdates } = updates as Record<string, unknown>
    await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: safeUpdates }
    )
  },

  async getNextOrderNumber(): Promise<string> {
    const db = getDB()
    const lastOrder = await db.collection(this.collection).find({}, { projection: { orderNumber: 1 } }).sort({ createdAt: -1 }).limit(1).next()
    const lastNumber = lastOrder?.orderNumber && /^CMD-(\d+)$/.test(lastOrder.orderNumber)
      ? Number(lastOrder.orderNumber.split('-')[1])
      : 1000

    return `CMD-${lastNumber + 1}`
  },
}

export const DeliveryConfigModel = {
  collection: 'remote_order_configs',

  async get(): Promise<DeliveryConfig> {
    const db = getDB()
    const doc = await db.collection(this.collection).findOne({})
    if (!doc) {
      const defaultConfig = { ...DEFAULT_DELIVERY_CONFIG, updatedAt: new Date() }
      const result = await db.collection(this.collection).insertOne(defaultConfig)
      return { _id: result.insertedId.toString(), ...defaultConfig }
    }
    return toDeliveryConfig(doc)
  },

  async update(updates: DeliveryConfigInput): Promise<DeliveryConfig> {
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
