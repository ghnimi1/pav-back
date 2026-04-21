import { UserModel } from '../models/User.model'
import type { User } from '../models/User.model'  // ← TYPE ONLY IMPORT
import { comparePassword, hashPassword } from '../utils/bcrypt'
import { generateToken } from '../utils/jwt'
import type { TokenPayload } from '../utils/jwt'  // ← TYPE ONLY IMPORT
import { getDB } from '../config/database'

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

export interface AuthResponse {
  token: string
  user: Omit<User, 'password'>
}

export class AuthService {
  
  /**
   * Connecter un utilisateur
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input
    
    // Vérifier email
    const user = await UserModel.findByEmail(email)
    if (!user) {
      throw new Error('Email ou mot de passe incorrect')
    }
    
    // Vérifier compte actif
    if (!user.isActive) {
      throw new Error('Votre compte a été désactivé')
    }
    
    // Vérifier mot de passe
    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      throw new Error('Email ou mot de passe incorrect')
    }
    
    // Mettre à jour dernière connexion
    await UserModel.updateLastLogin(user._id!)
    
    // Générer token
    const tokenPayload: TokenPayload = {
      id: user._id!,
      email: user.email,
      role: user.role
    }
    const token = generateToken(tokenPayload)
    
    // Retourner sans mot de passe
    const { password: _, ...userWithoutPassword } = user
    return { token, user: userWithoutPassword }
  }
  
  /**
   * Enregistrer un nouveau client
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name, phone, referralCode } = input
    
    // Vérifier email existant
    const existing = await UserModel.findByEmail(email)
    if (existing) {
      throw new Error('Cet email est déjà utilisé')
    }
    
    // Créer l'utilisateur
    const newUser = await UserModel.create({
      email,
      password,
      name,
      role: 'client',
      phone
    })
    
    // Traiter le parrainage si code fourni
    if (referralCode) {
      await this.processReferral(referralCode.toUpperCase(), newUser)
    }
    
    // Générer token
    const tokenPayload: TokenPayload = {
      id: newUser._id!,
      email: newUser.email,
      role: newUser.role
    }
    const token = generateToken(tokenPayload)
    
    // Retourner sans mot de passe
    const { password: _, ...userWithoutPassword } = newUser
    return { token, user: userWithoutPassword }
  }
  
  /**
   * Traiter le parrainage à l'inscription
   */
  private async processReferral(referralCode: string, newUser: User): Promise<void> {
    const referrer = await UserModel.findByReferralCode(referralCode)
    
    if (!referrer || referrer.role !== 'client') {
      return // Code invalide, ignorer
    }
    
    const db = getDB()
    
    // Créer l'enregistrement de parrainage
    await db.collection('referrals').insertOne({
      referrerId: referrer._id,
      referredId: newUser._id,
      referredName: newUser.name,
      referredEmail: newUser.email,
      status: 'first_purchase_pending',
      referrerReward: 100,
      referredReward: 50,
      createdAt: new Date()
    })
    
    // Donner les points de bienvenue au filleul
    await UserModel.addPoints(newUser._id!, 50, 'Points de bienvenue - Parrainage')
    
    // Incrémenter compteur de parrainages du parrain
    await UserModel.update(referrer._id!, {
      referralCount: (referrer.referralCount || 0) + 1
    })
  }
  
  /**
   * Valider un parrainage après premier achat
   */
  async validateReferralFirstPurchase(referralId: string, purchaseAmount: number): Promise<void> {
    const db = getDB()
    const { ObjectId } = await import('mongodb')
    
    const referral = await db.collection('referrals').findOne({ _id: new ObjectId(referralId) })
    if (!referral || referral.status !== 'first_purchase_pending') {
      throw new Error('Parrainage non trouvé ou déjà traité')
    }
    
    // Mettre à jour le statut
    await db.collection('referrals').updateOne(
      { _id: new ObjectId(referralId) },
      { 
        $set: { 
          status: 'rewarded',
          firstPurchaseAmount: purchaseAmount,
          firstPurchaseDate: new Date(),
          completedAt: new Date()
        }
      }
    )
    
    // Donner les points au parrain
    await UserModel.addPoints(
      referral.referrerId, 
      referral.referrerReward, 
      `Bonus parrainage - 1er achat de ${referral.referredName}`
    )
  }
  
  /**
   * Récupérer les informations de l'utilisateur connecté
   */
  async getMe(userId: string): Promise<Omit<User, 'password'>> {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }
    
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  
  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(userId: string, updates: { name?: string; phone?: string }): Promise<Omit<User, 'password'>> {
    await UserModel.update(userId, updates)
    return this.getMe(userId)
  }
  
  /**
   * Changer le mot de passe
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }
    
    const isValid = await comparePassword(oldPassword, user.password)
    if (!isValid) {
      throw new Error('Mot de passe actuel incorrect')
    }
    
    const hashedPassword = await hashPassword(newPassword)
    await UserModel.update(userId, { password: hashedPassword })
  }
  
  /**
   * Ajouter des points de fidélité
   */
  async addLoyaltyPoints(userId: string, points: number, description: string): Promise<void> {
    await UserModel.addPoints(userId, points, description)
  }
  
  /**
   * Utiliser des points de fidélité
   */
  async redeemLoyaltyPoints(userId: string, points: number, description: string): Promise<boolean> {
    return await UserModel.redeemPoints(userId, points, description)
  }
  
  /**
   * Obtenir les statistiques de fidélité d'un client
   */
  async getLoyaltyStats(userId: string) {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }
    
    const db = getDB()
    const transactions = await db.collection('transactions')
      .find({ clientId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()
    
    const referrals = await db.collection('referrals')
      .find({ referrerId: userId })
      .toArray()
    
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
        completed: referrals.filter(r => r.status === 'rewarded').length,
        pending: referrals.filter(r => r.status === 'first_purchase_pending').length
      }
    }
  }
}

// Export une instance unique
export const authService = new AuthService()