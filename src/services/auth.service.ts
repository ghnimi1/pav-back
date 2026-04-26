import { getDB } from '../config/database'
import { UserModel } from '../models/User.model'
import type { EmployeeRole, User } from '../models/User.model'
import { comparePassword, hashPassword } from '../utils/bcrypt'
import { generateToken } from '../utils/jwt'
import type { TokenPayload } from '../utils/jwt'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
  phone?: string
  referralCode?: string
}

export interface EmployeeInput {
  email: string
  password: string
  name: string
  phone?: string
  employeeRole: EmployeeRole
  permissions: string[]
  isActive?: boolean
}

export interface LoyaltyPointsInput {
  userId: string
  points: number
  description: string
  totalSpent?: number
  totalOrdersIncrement?: number
  lastVisit?: string
}

export interface LoyaltyClientUpdateInput {
  userId: string
  totalSpent?: number
  totalOrders?: number
  lastVisit?: string
  walletBalance?: number
}

export interface ReferralConfig {
  referrerReward: number
  referredReward: number
}

export interface ReferralRecord {
  id: string
  referrerId: string
  referredId: string
  referredName: string
  referredEmail: string
  status: 'pending' | 'first_purchase_pending' | 'completed' | 'rewarded'
  referrerReward: number
  referredReward: number
  firstPurchaseAmount?: number
  firstPurchaseDate?: string
  validatedBy?: string
  createdAt: string
  completedAt?: string
}

export interface AuthResponse {
  token: string
  user: Omit<User, 'password'>
}

export class AuthService {
  private readonly defaultReferralConfig: ReferralConfig = {
    referrerReward: 100,
    referredReward: 50,
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  private async getReferralConfigDocument() {
    const db = getDB()
    return db.collection('referral_config').findOne({})
  }

  async getReferralConfig(): Promise<ReferralConfig> {
    const config = await this.getReferralConfigDocument()
    return {
      referrerReward: typeof config?.referrerReward === 'number' ? config.referrerReward : this.defaultReferralConfig.referrerReward,
      referredReward: typeof config?.referredReward === 'number' ? config.referredReward : this.defaultReferralConfig.referredReward,
    }
  }

  async updateReferralConfig(config: ReferralConfig): Promise<ReferralConfig> {
    const db = getDB()
    const existing = await this.getReferralConfigDocument()
    const nextConfig = {
      referrerReward: config.referrerReward,
      referredReward: config.referredReward,
      updatedAt: new Date(),
    }

    if (existing?._id) {
      await db.collection('referral_config').updateOne(
        { _id: existing._id },
        { $set: nextConfig }
      )
    } else {
      await db.collection('referral_config').insertOne(nextConfig)
    }

    return {
      referrerReward: nextConfig.referrerReward,
      referredReward: nextConfig.referredReward,
    }
  }

  private async assertEmployeeManagementAccess(actorId: string): Promise<User> {
    const actor = await UserModel.findById(actorId)
    if (!actor) {
      throw new Error('Utilisateur non trouve')
    }

    const canManageEmployees =
      actor.role === 'admin' && (!actor.employeeRole || actor.employeeRole === 'super_admin')

    if (!canManageEmployees) {
      throw new Error('Acces refuse')
    }

    return actor
  }

  private async assertLoyaltyAccess(actorId: string, targetUserId: string): Promise<void> {
    const actor = await UserModel.findById(actorId)
    if (!actor) {
      throw new Error('Utilisateur non trouve')
    }

    const isSelf = actor._id === targetUserId
    const isAdmin = actor.role === 'admin'

    if (!isSelf && !isAdmin) {
      throw new Error('Acces refuse')
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input

    const user = await UserModel.findByEmail(email)
    if (!user) {
      throw new Error('Email ou mot de passe incorrect')
    }

    if (!user.isActive) {
      throw new Error('Votre compte a ete desactive')
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      throw new Error('Email ou mot de passe incorrect')
    }

    await UserModel.updateLastLogin(user._id!)

    const tokenPayload: TokenPayload = {
      id: user._id!,
      email: user.email,
      role: user.role,
    }

    return {
      token: generateToken(tokenPayload),
      user: this.sanitizeUser(user),
    }
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name, phone, referralCode } = input

    const existing = await UserModel.findByEmail(email)
    if (existing) {
      throw new Error('Cet email est deja utilise')
    }

    const newUser = await UserModel.create({
      email,
      password,
      name,
      role: 'client',
      phone,
    })

    if (referralCode) {
      await this.processReferral(referralCode.toUpperCase(), newUser)
    }

    const tokenPayload: TokenPayload = {
      id: newUser._id!,
      email: newUser.email,
      role: newUser.role,
    }

    return {
      token: generateToken(tokenPayload),
      user: this.sanitizeUser(newUser),
    }
  }

  private async processReferral(referralCode: string, newUser: User): Promise<void> {
    const referrer = await UserModel.findByReferralCode(referralCode)
    if (!referrer || referrer.role !== 'client') {
      return
    }

    const referralConfig = await this.getReferralConfig()
    const db = getDB()
    await db.collection('referrals').insertOne({
      referrerId: referrer._id,
      referredId: newUser._id,
      referredName: newUser.name,
      referredEmail: newUser.email,
      status: 'first_purchase_pending',
      referrerReward: referralConfig.referrerReward,
      referredReward: referralConfig.referredReward,
      createdAt: new Date(),
    })

    await UserModel.addPoints(newUser._id!, referralConfig.referredReward, 'Points de bienvenue - Parrainage')
    await UserModel.update(referrer._id!, {
      referralCount: (referrer.referralCount || 0) + 1,
    })
  }

  async validateReferralFirstPurchase(referralId: string, purchaseAmount: number): Promise<void> {
    const db = getDB()
    const { ObjectId } = await import('mongodb')

    const referral = await db.collection('referrals').findOne({ _id: new ObjectId(referralId) })
    if (!referral || referral.status !== 'first_purchase_pending') {
      throw new Error('Parrainage non trouve ou deja traite')
    }

    await db.collection('referrals').updateOne(
      { _id: new ObjectId(referralId) },
      {
        $set: {
          status: 'rewarded',
          firstPurchaseAmount: purchaseAmount,
          firstPurchaseDate: new Date(),
          completedAt: new Date(),
        },
      }
    )

    await UserModel.addPoints(
      referral.referrerId,
      referral.referrerReward,
      `Bonus parrainage - 1er achat de ${referral.referredName}`
    )
  }

  async validateReferralFirstPurchaseForClient(
    purchaseAmount: number,
    clientId?: string,
    clientEmail?: string
  ): Promise<void> {
    const db = getDB()

    const referral = await db.collection('referrals').findOne({
      status: 'first_purchase_pending',
      ...(clientId || clientEmail
        ? {
            $or: [
              ...(clientId ? [{ referredId: clientId }] : []),
              ...(clientEmail ? [{ referredEmail: clientEmail }] : []),
            ],
          }
        : {}),
    })

    if (!referral) {
      return
    }

    await db.collection('referrals').updateOne(
      { _id: referral._id },
      {
        $set: {
          status: 'rewarded',
          firstPurchaseAmount: purchaseAmount,
          firstPurchaseDate: new Date(),
          completedAt: new Date(),
          validatedBy: 'system-order-create',
        },
      }
    )

    await UserModel.addPoints(
      String(referral.referrerId),
      referral.referrerReward,
      `Bonus parrainage - 1er achat de ${referral.referredName}`
    )
  }

  async getReferrals(actorId: string): Promise<ReferralRecord[]> {
    const actor = await UserModel.findById(actorId)
    if (!actor) {
      throw new Error('Utilisateur non trouve')
    }

    const db = getDB()
    const query =
      actor.role === 'admin'
        ? {}
        : {
            $or: [{ referrerId: actorId }, { referredId: actorId }],
          }

    const referrals = await db.collection('referrals').find(query).sort({ createdAt: -1 }).toArray()

    return referrals.map((referral) => ({
      id: referral._id.toString(),
      referrerId: String(referral.referrerId || ''),
      referredId: String(referral.referredId || ''),
      referredName: referral.referredName || '',
      referredEmail: referral.referredEmail || '',
      status: (referral.status || 'pending') as ReferralRecord['status'],
      referrerReward: referral.referrerReward || 0,
      referredReward: referral.referredReward || 0,
      firstPurchaseAmount: referral.firstPurchaseAmount,
      firstPurchaseDate: referral.firstPurchaseDate ? new Date(referral.firstPurchaseDate).toISOString() : undefined,
      validatedBy: referral.validatedBy,
      createdAt: referral.createdAt ? new Date(referral.createdAt).toISOString() : new Date().toISOString(),
      completedAt: referral.completedAt ? new Date(referral.completedAt).toISOString() : undefined,
    }))
  }

  async getMe(userId: string): Promise<Omit<User, 'password'>> {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new Error('Utilisateur non trouve')
    }
    return this.sanitizeUser(user)
  }

  async updateProfile(userId: string, updates: { name?: string; phone?: string }): Promise<Omit<User, 'password'>> {
    await UserModel.update(userId, updates)
    return this.getMe(userId)
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new Error('Utilisateur non trouve')
    }

    const isValid = await comparePassword(oldPassword, user.password)
    if (!isValid) {
      throw new Error('Mot de passe actuel incorrect')
    }

    const hashedPassword = await hashPassword(newPassword)
    await UserModel.update(userId, { password: hashedPassword })
  }

  async addLoyaltyPoints(userId: string, points: number, description: string): Promise<void> {
    await UserModel.addPoints(userId, points, description)
  }

  async redeemLoyaltyPoints(userId: string, points: number, description: string): Promise<boolean> {
    return await UserModel.redeemPoints(userId, points, description)
  }

  async awardLoyaltyPoints(actorId: string, input: LoyaltyPointsInput): Promise<Omit<User, 'password'>> {
    await this.assertLoyaltyAccess(actorId, input.userId)

    await UserModel.addPoints(input.userId, input.points, input.description)

    const currentUser = await UserModel.findById(input.userId)
    if (!currentUser) {
      throw new Error('Utilisateur non trouve')
    }

    const nextTotalSpent = input.totalSpent ?? currentUser.totalSpent
    const nextTotalOrders = input.totalOrdersIncrement !== undefined
      ? (currentUser.totalOrders || 0) + input.totalOrdersIncrement
      : currentUser.totalOrders

    await UserModel.update(input.userId, {
      totalSpent: nextTotalSpent,
      totalOrders: nextTotalOrders,
      lastLogin: input.lastVisit ? new Date(input.lastVisit) : currentUser.lastLogin,
    })

    const updatedUser = await UserModel.findById(input.userId)
    if (!updatedUser) {
      throw new Error('Utilisateur non trouve')
    }

    return this.sanitizeUser(updatedUser)
  }

  async updateLoyaltyClient(actorId: string, input: LoyaltyClientUpdateInput): Promise<Omit<User, 'password'>> {
    await this.assertLoyaltyAccess(actorId, input.userId)

    const currentUser = await UserModel.findById(input.userId)
    if (!currentUser) {
      throw new Error('Utilisateur non trouve')
    }

    await UserModel.update(input.userId, {
      totalSpent: input.totalSpent ?? currentUser.totalSpent,
      totalOrders: input.totalOrders ?? currentUser.totalOrders,
      walletBalance: input.walletBalance ?? currentUser.walletBalance,
      lastLogin: input.lastVisit ? new Date(input.lastVisit) : currentUser.lastLogin,
    })

    const updatedUser = await UserModel.findById(input.userId)
    if (!updatedUser) {
      throw new Error('Utilisateur non trouve')
    }

    return this.sanitizeUser(updatedUser)
  }

  async getLoyaltyStats(userId: string) {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new Error('Utilisateur non trouve')
    }

    const db = getDB()
    const transactions = await db.collection('transactions').find({ clientId: userId }).sort({ createdAt: -1 }).limit(20).toArray()
    const referrals = await db.collection('referrals').find({ referrerId: userId }).toArray()

    const tierOrder = ['bronze', 'silver', 'gold', 'diamond']
    const currentTierIndex = tierOrder.indexOf(user.loyaltyTier)
    const nextTier = currentTierIndex < 3 ? tierOrder[currentTierIndex + 1] : null

    let pointsToNextTier = 0
    if (nextTier) {
      const thresholds = { silver: 500, gold: 1500, diamond: 3000 }
      pointsToNextTier = thresholds[nextTier as keyof typeof thresholds] - user.lifetimePoints
    }

    return {
      currentPoints: user.loyaltyPoints,
      lifetimePoints: user.lifetimePoints,
      tier: user.loyaltyTier,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      totalSpent: user.totalSpent,
      totalOrders: user.totalOrders,
      referralCount: user.referralCount,
      walletBalance: user.walletBalance,
      recentTransactions: transactions,
      referrals: {
        total: referrals.length,
        completed: referrals.filter((referral) => referral.status === 'rewarded').length,
        pending: referrals.filter((referral) => referral.status === 'first_purchase_pending').length,
      },
    }
  }

  async getEmployees(actorId: string): Promise<Array<Omit<User, 'password'>>> {
    //await this.assertEmployeeManagementAccess(actorId)
    const employees = await UserModel.findAllEmployees()
    return employees.map((employee) => this.sanitizeUser(employee))
  }

  async getClients(actorId: string): Promise<Array<Omit<User, 'password'>>> {
    //await this.assertEmployeeManagementAccess(actorId)
    const clients = await UserModel.findAllClients()
    return clients.map((client) => this.sanitizeUser(client))
  }

  async createEmployee(actorId: string, input: EmployeeInput): Promise<Omit<User, 'password'>> {
    await this.assertEmployeeManagementAccess(actorId)

    const existing = await UserModel.findByEmail(input.email)
    if (existing) {
      throw new Error('Cet email est deja utilise')
    }

    const role = input.employeeRole === 'employee' ? 'user' : 'admin'
    const employee = await UserModel.create({
      email: input.email,
      password: input.password,
      name: input.name,
      role,
      phone: input.phone,
      employeeRole: input.employeeRole,
      permissions: input.permissions,
      isActive: input.isActive,
    })

    return this.sanitizeUser(employee)
  }

  async updateEmployee(
    actorId: string,
    employeeId: string,
    updates: Partial<EmployeeInput> & { email?: string }
  ): Promise<Omit<User, 'password'>> {
    await this.assertEmployeeManagementAccess(actorId)

    const employee = await UserModel.findById(employeeId)
    if (!employee || !employee.employeeRole) {
      throw new Error('Employe non trouve')
    }

    if (updates.email && updates.email !== employee.email) {
      const existing = await UserModel.findByEmail(updates.email)
      if (existing && existing._id !== employeeId) {
        throw new Error('Cet email est deja utilise')
      }
    }

    const nextEmployeeRole = updates.employeeRole ?? employee.employeeRole
    const payload: Partial<User> = {
      name: updates.name ?? employee.name,
      email: updates.email ?? employee.email,
      phone: updates.phone !== undefined ? updates.phone : employee.phone,
      employeeRole: nextEmployeeRole,
      permissions: updates.permissions ?? employee.permissions,
      isActive: updates.isActive ?? employee.isActive,
      role: nextEmployeeRole === 'employee' ? 'user' : 'admin',
    }

    if (updates.password) {
      payload.password = await hashPassword(updates.password)
    }

    await UserModel.update(employeeId, payload)
    const updatedEmployee = await UserModel.findById(employeeId)
    if (!updatedEmployee) {
      throw new Error('Employe non trouve apres mise a jour')
    }

    return this.sanitizeUser(updatedEmployee)
  }

  async deleteEmployee(actorId: string, employeeId: string): Promise<void> {
    await this.assertEmployeeManagementAccess(actorId)

    const employee = await UserModel.findById(employeeId)
    if (!employee || !employee.employeeRole) {
      throw new Error('Employe non trouve')
    }

    if (employee._id === actorId) {
      throw new Error('Vous ne pouvez pas supprimer votre propre compte')
    }

    if (employee.employeeRole === 'super_admin') {
      const employees = await UserModel.findAllEmployees()
      const superAdmins = employees.filter((item) => item.employeeRole === 'super_admin')
      if (superAdmins.length <= 1) {
        throw new Error('Impossible de supprimer le dernier super admin')
      }
    }

    await UserModel.delete(employeeId)
  }
}

export const authService = new AuthService()
