import { getDB } from '../config/database'
import { hashPassword } from '../utils/bcrypt'
import { ObjectId, type WithId, type Document } from 'mongodb'

export type UserRole = 'admin' | 'user' | 'client'
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'diamond'
export type EmployeeRole = 'super_admin' | 'admin' | 'manager' | 'employee'

export interface User {
  _id?: string
  email: string
  password: string
  name: string
  role: UserRole
  phone?: string
  // Loyalty fields (for clients)
  loyaltyPoints: number
  lifetimePoints: number
  loyaltyTier: LoyaltyTier
  totalSpent: number
  totalOrders: number
  referralCode: string
  referralCount: number
  walletBalance: number
  qrCode: string
  // Employee fields (for admin/employee users)
  employeeRole?: EmployeeRole
  permissions?: string[]
  // Timestamps
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  password: string
  name: string
  role?: UserRole
  phone?: string
  referralCode?: string
  employeeRole?: EmployeeRole
  permissions?: string[]
  isActive?: boolean
}

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  diamond: 3000
}

function calculateTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= TIER_THRESHOLDS.diamond) return 'diamond'
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold'
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver'
  return 'bronze'
}

function generateReferralCode(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${suffix}`
}

function generateQRCode(): string {
  return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

// Helper function to convert MongoDB document to User
function toUser(doc: WithId<Document> | null): User | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    email: doc.email,
    password: doc.password,
    name: doc.name,
    role: doc.role,
    phone: doc.phone,
    loyaltyPoints: doc.loyaltyPoints || 0,
    lifetimePoints: doc.lifetimePoints || 0,
    loyaltyTier: doc.loyaltyTier || 'bronze',
    totalSpent: doc.totalSpent || 0,
    totalOrders: doc.totalOrders || 0,
    referralCode: doc.referralCode,
    referralCount: doc.referralCount || 0,
    walletBalance: doc.walletBalance || 0,
    qrCode: doc.qrCode,
    employeeRole: doc.employeeRole,
    permissions: doc.permissions,
    isActive: doc.isActive ?? true,
    lastLogin: doc.lastLogin,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

// Helper function to convert array of documents to Users
function toUsers(docs: WithId<Document>[]): User[] {
  return docs.map(doc => toUser(doc)!).filter((u): u is User => u !== null)
}

export const UserModel = {
  collection: 'users',
  
  async create(input: CreateUserInput): Promise<User> {
    const db = getDB()
    const now = new Date()
    const hashedPassword = await hashPassword(input.password)
    
    const newUser: Omit<User, '_id'> = {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: input.role || 'client',
      phone: input.phone,
      loyaltyPoints: 0,
      lifetimePoints: 0,
      loyaltyTier: 'bronze',
      totalSpent: 0,
      totalOrders: 0,
      referralCode: generateReferralCode(input.name),
      referralCount: 0,
      walletBalance: 0,
      qrCode: generateQRCode(),
      employeeRole: input.employeeRole,
      permissions: input.permissions,
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('users').insertOne(newUser)
    return { _id: result.insertedId.toString(), ...newUser }
  },
  
  async findByEmail(email: string): Promise<User | null> {
    const db = getDB()
    const doc = await db.collection('users').findOne({ email })
    return toUser(doc)
  },
  
  async findById(id: string): Promise<User | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('users').findOne({ _id: new ObjectId(id) })
    return toUser(doc)
  },
  
  async findByReferralCode(code: string): Promise<User | null> {
    const db = getDB()
    const doc = await db.collection('users').findOne({ referralCode: code })
    return toUser(doc)
  },
  
  async update(id: string, updates: Partial<User>): Promise<void> {
    const db = getDB()
    
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    
    // If loyalty points changed, recalculate tier
    if (updates.loyaltyPoints !== undefined) {
      const current = await this.findById(id)
      if (current) {
        const newLifetimePoints = (current.lifetimePoints || 0) + (updates.loyaltyPoints - (current.loyaltyPoints || 0))
        updates.lifetimePoints = newLifetimePoints
        updates.loyaltyTier = calculateTier(newLifetimePoints)
      }
    }
    
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates as any
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },
  
  async addPoints(id: string, points: number, description: string): Promise<void> {
    const user = await this.findById(id)
    if (!user) throw new Error('Utilisateur non trouvé')
    
    const newPoints = (user.loyaltyPoints || 0) + points
    const newLifetimePoints = (user.lifetimePoints || 0) + points
    const newTier = calculateTier(newLifetimePoints)
    
    await this.update(id, {
      loyaltyPoints: newPoints,
      lifetimePoints: newLifetimePoints,
      loyaltyTier: newTier
    })
    
    // Record transaction
    const db = getDB()
    await db.collection('transactions').insertOne({
      clientId: id,
      type: 'earn',
      points,
      description,
      createdAt: new Date()
    })
  },
  
  async redeemPoints(id: string, points: number, description: string): Promise<boolean> {
    const user = await this.findById(id)
    if (!user || (user.loyaltyPoints || 0) < points) return false
    
    await this.update(id, {
      loyaltyPoints: (user.loyaltyPoints || 0) - points
    })
    
    const db = getDB()
    await db.collection('transactions').insertOne({
      clientId: id,
      type: 'redeem',
      points: -points,
      description,
      createdAt: new Date()
    })
    
    return true
  },
  
  async updateLastLogin(id: string): Promise<void> {
    await this.update(id, { lastLogin: new Date() })
  },
  
  async findAllClients(): Promise<User[]> {
    const db = getDB()
    const docs = await db.collection('users')
      .find({ role: 'client' })
      .sort({ createdAt: -1 })
      .toArray()
    return toUsers(docs)
  },
  
  async findAllEmployees(): Promise<User[]> {
    const db = getDB()
    const docs = await db.collection('users')
      .find({ employeeRole: { $exists: true } })
      .sort({ createdAt: -1 })
      .toArray()
    return toUsers(docs)
  },
  
  async deactivate(id: string): Promise<void> {
    await this.update(id, { isActive: false })
  },
  
  async activate(id: string): Promise<void> {
    await this.update(id, { isActive: true })
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) throw new Error('ID invalide')
    await db.collection('users').deleteOne({ _id: new ObjectId(id) })
  },
  
  async countClients(): Promise<number> {
    const db = getDB()
    return await db.collection('users').countDocuments({ role: 'client' })
  }
}
