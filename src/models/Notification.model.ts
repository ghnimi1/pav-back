import { ObjectId, type Document, type WithId } from 'mongodb'
import { getDB } from '../config/database'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'
export type NotificationCategory = 'order' | 'stock' | 'production' | 'client' | 'payment' | 'system'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'
export type NotificationRecipientRole = 'admin' | 'client' | 'all'

export interface AppNotification {
  _id?: string
  id?: string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message?: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
  recipientRole: NotificationRecipientRole
  recipientId?: string
  recipientEmail?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface CreateAppNotificationInput {
  type: NotificationType
  category?: NotificationCategory
  priority?: NotificationPriority
  title: string
  message?: string
  actionUrl?: string
  actionLabel?: string
  recipientRole?: NotificationRecipientRole
  recipientId?: string
  recipientEmail?: string
  metadata?: Record<string, unknown>
}

export interface PaginatedNotifications {
  notifications: AppNotification[]
  total: number
  unread: number
  limit: number
  skip: number
  hasMore: boolean
}

const RETENTION_DAYS = 7

function toNotification(doc: WithId<Document> | null): AppNotification | null {
  if (!doc) return null

  return {
    _id: doc._id.toString(),
    id: doc._id.toString(),
    type: doc.type || 'info',
    category: doc.category || 'system',
    priority: doc.priority || 'medium',
    title: doc.title,
    message: doc.message,
    read: doc.read === true,
    actionUrl: doc.actionUrl,
    actionLabel: doc.actionLabel,
    recipientRole: doc.recipientRole || 'admin',
    recipientId: doc.recipientId,
    recipientEmail: doc.recipientEmail,
    metadata: doc.metadata,
    createdAt: doc.createdAt || new Date(),
  }
}

function getUserQuery(user: { id?: string; email?: string; role?: string }) {
  return user.role === 'admin'
    ? { recipientRole: { $in: ['admin', 'all'] } }
    : {
        $or: [
          { recipientRole: 'all' },
          { recipientRole: 'client', recipientId: user.id },
          { recipientRole: 'client', recipientEmail: user.email },
        ],
      }
}

export const NotificationModel = {
  collection: 'notifications',

  async deleteExpired(): Promise<void> {
    const db = getDB()
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
    await db.collection(this.collection).deleteMany({ createdAt: { $lt: cutoff } })
  },

  async create(input: CreateAppNotificationInput): Promise<AppNotification> {
    const db = getDB()
    await this.deleteExpired()
    const notification: Omit<AppNotification, '_id' | 'id'> = {
      type: input.type,
      category: input.category || 'system',
      priority: input.priority || 'medium',
      title: input.title,
      message: input.message,
      read: false,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      recipientRole: input.recipientRole || 'admin',
      recipientId: input.recipientId,
      recipientEmail: input.recipientEmail,
      metadata: input.metadata,
      createdAt: new Date(),
    }

    const result = await db.collection(this.collection).insertOne(notification)
    return { _id: result.insertedId.toString(), id: result.insertedId.toString(), ...notification }
  },

  async findForUser(
    user: { id?: string; email?: string; role?: string },
    options: { limit?: number; skip?: number } = {}
  ): Promise<PaginatedNotifications> {
    const db = getDB()
    await this.deleteExpired()
    const limit = Math.min(Math.max(options.limit || 20, 1), 50)
    const skip = Math.max(options.skip || 0, 0)
    const query = getUserQuery(user)

    const [docs, total, unread] = await Promise.all([
      db.collection(this.collection).find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection(this.collection).countDocuments(query),
      db.collection(this.collection).countDocuments({ ...query, read: { $ne: true } }),
    ])

    const notifications = docs.map((doc) => toNotification(doc)!).filter(Boolean)
    return {
      notifications,
      total,
      unread,
      limit,
      skip,
      hasMore: skip + notifications.length < total,
    }
  },

  async markAsRead(id: string): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return
    await db.collection(this.collection).updateOne({ _id: new ObjectId(id) }, { $set: { read: true } })
  },

  async markAllAsRead(user: { id?: string; email?: string; role?: string }, category?: NotificationCategory): Promise<void> {
    const db = getDB()
    const baseQuery = getUserQuery(user)
    const query = category ? { ...baseQuery, category } : baseQuery
    await db.collection(this.collection).updateMany(query, { $set: { read: true } })
  },

  async delete(id: string): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return
    await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) })
  },

  async clearForUser(user: { id?: string; email?: string; role?: string }): Promise<void> {
    const db = getDB()
    const query = user.role === 'admin'
      ? getUserQuery(user)
      : {
          $or: [
            { recipientRole: 'client', recipientId: user.id },
            { recipientRole: 'client', recipientEmail: user.email },
          ],
        }
    await db.collection(this.collection).deleteMany(query)
  },
}
