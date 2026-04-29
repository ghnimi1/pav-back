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

export interface MissionRecord {
  id: string
  name: string
  description: string
  type: 'visit' | 'spend' | 'refer' | 'birthday' | 'review' | 'social' | 'challenge'
  target: number
  reward: number
  bonusReward?: number
  validFrom: string
  validUntil: string
  isActive: boolean
  icon?: string
  createdAt: string
}

export interface SpecialDayRecord {
  id: string
  name: string
  description: string
  targetGender?: 'male' | 'female' | 'other'
  dayOfWeek?: number
  specificDate?: string
  multiplier: number
  bonusPoints?: number
  isActive: boolean
  createdAt: string
}

export interface ClientMissionRecord {
  id: string
  clientId: string
  missionId: string
  progress: number
  status: 'active' | 'completed' | 'expired'
  completedAt?: string
  createdAt: string
}

export interface GameRewardRecord {
  id: string
  name: string
  points: number
  probability: number
  color: string
  type?: 'points' | 'discount' | 'free_item'
  value?: number
  wheelSegment?: number
}

export interface GameConfigRecord {
  id: string
  name: string
  icon: 'roulette' | 'chichbich'
  enabled: boolean
  startHour: number
  endHour: number
  maxPlaysPerDay: number
  minPointsRequired: number
  rewards: GameRewardRecord[]
}

export interface GamePlayPrizeRecord {
  type: 'points' | 'discount' | 'free_item'
  value: number
  description: string
}

export interface GamePlayRecord {
  id: string
  clientId: string
  gameType: 'roulette' | 'chichbich' | 'share_spin'
  result: 'win' | 'lose'
  prize?: GamePlayPrizeRecord
  playedAt: string
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

export interface LoyaltyStampPositionRecord {
  position: number
  type: 'normal' | 'game' | 'reward'
  gameConfig?: {
    gameName: string
    chances: number
    winCondition: 'double-6' | 'double-any' | 'sum-12'
    rewardProductIds: string[]
  }
  rewardConfig?: {
    rewardProductIds: string[]
    rewardText: string
  }
}

export interface LoyaltyCardConfigRecord {
  id: string
  name: string
  description: string
  productName: string
  productPrice: number
  eligibleProductIds: string[]
  totalStamps: number
  stampPositions: LoyaltyStampPositionRecord[]
  expirationDays: number
  backgroundColor: 'dark' | 'light'
  stampIcon: 'cup' | 'croissant' | 'custom'
  customStampImage?: string
  gridColumns: number
  isActive: boolean
  autoRenew: boolean
  createdAt: string
  updatedAt: string
}

export interface LoyaltyCardGameResultRecord {
  played: boolean
  won: boolean
  diceResults: [number, number][]
  finalDice?: [number, number]
  rewardProductId?: string
  playedAt: string
}

export interface LoyaltyCustomerStampRecord {
  position: number
  stampedAt: string
  orderId: string
  productId: string
  productName: string
  gameResult?: LoyaltyCardGameResultRecord
  rewardClaimed?: boolean
  rewardProductId?: string
}

export interface LoyaltyCustomerCardRecord {
  id: string
  configId: string
  visitorId: string
  stamps: LoyaltyCustomerStampRecord[]
  currentStampCount: number
  status: 'active' | 'completed' | 'expired'
  expirationDate: string
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
  private readonly defaultMissions: Omit<MissionRecord, 'id'>[] = [
    {
      name: 'Premiere Visite',
      description: 'Effectuez votre premier achat',
      type: 'visit',
      target: 1,
      reward: 25,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      icon: 'star',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Client Fidele',
      description: 'Effectuez 10 achats',
      type: 'visit',
      target: 10,
      reward: 100,
      bonusReward: 50,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      icon: 'heart',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Parrain VIP',
      description: 'Parrainez 3 amis',
      type: 'refer',
      target: 3,
      reward: 150,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      icon: 'users',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Gros Achat',
      description: 'Depensez 100 TND en une seule commande',
      type: 'spend',
      target: 100,
      reward: 75,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      icon: 'shopping-bag',
      createdAt: new Date().toISOString(),
    },
  ]
  private readonly defaultSpecialDays: Omit<SpecialDayRecord, 'id'>[] = [
    {
      name: 'Journee des Femmes',
      description: 'Points doubles pour les femmes le mercredi',
      targetGender: 'female',
      dayOfWeek: 3,
      multiplier: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Journee des Hommes',
      description: 'Points doubles pour les hommes le jeudi',
      targetGender: 'male',
      dayOfWeek: 4,
      multiplier: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ]
  private readonly defaultGamesConfig: GameConfigRecord[] = [
    {
      id: 'roulette',
      name: 'Roulette de la Chance',
      icon: 'roulette',
      enabled: true,
      startHour: 10,
      endHour: 14,
      maxPlaysPerDay: 3,
      minPointsRequired: 50,
      rewards: [
        { id: 'r1', name: '5 Points Bonus', points: 5, probability: 30, color: '#22c55e' },
        { id: 'r2', name: '10 Points Bonus', points: 10, probability: 25, color: '#3b82f6' },
        { id: 'r3', name: '25 Points Bonus', points: 25, probability: 15, color: '#a855f7' },
        { id: 'r4', name: '50 Points Bonus', points: 50, probability: 8, color: '#f59e0b' },
        { id: 'r5', name: '100 Points Bonus', points: 100, probability: 2, color: '#ef4444' },
        { id: 'r6', name: 'Rejouer', points: 0, probability: 20, color: '#64748b' },
      ],
    },
    {
      id: 'chichbich',
      name: 'Chichbich (Des Tunisiens)',
      icon: 'chichbich',
      enabled: true,
      startHour: 18,
      endHour: 22,
      maxPlaysPerDay: 2,
      minPointsRequired: 100,
      rewards: [
        { id: 'c1', name: 'Double (x2)', points: 20, probability: 16.67, color: '#22c55e' },
        { id: 'c2', name: 'Triple', points: 50, probability: 2.78, color: '#f59e0b' },
        { id: 'c3', name: 'Chichbich!', points: 200, probability: 0.46, color: '#ef4444' },
      ],
    },
  ]

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  private async assertAdmin(actorId: string): Promise<void> {
    const actor = await UserModel.findById(actorId)
    if (!actor || actor.role !== 'admin') {
      throw new Error('Acces refuse')
    }
  }

  private missionCollection() {
    return getDB().collection('missions')
  }

  private specialDaysCollection() {
    return getDB().collection('special_days')
  }

  private clientMissionsCollection() {
    return getDB().collection('client_missions')
  }

  private gamesConfigCollection() {
    return getDB().collection('games_config')
  }

  private gamePlaysCollection() {
    return getDB().collection('game_plays')
  }

  private loyaltyCardSettingsCollection() {
    return getDB().collection('loyalty_card_settings')
  }

  private loyaltyCustomerCardsCollection() {
    return getDB().collection('loyalty_customer_cards')
  }

  private mapMission(doc: any): MissionRecord {
    return {
      id: doc._id.toString(),
      name: doc.name || '',
      description: doc.description || '',
      type: doc.type || 'visit',
      target: doc.target || 0,
      reward: doc.reward || 0,
      bonusReward: doc.bonusReward,
      validFrom: new Date(doc.validFrom).toISOString(),
      validUntil: new Date(doc.validUntil).toISOString(),
      isActive: doc.isActive ?? true,
      icon: doc.icon,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    }
  }

  private mapSpecialDay(doc: any): SpecialDayRecord {
    return {
      id: doc._id.toString(),
      name: doc.name || '',
      description: doc.description || '',
      targetGender: doc.targetGender,
      dayOfWeek: doc.dayOfWeek,
      specificDate: doc.specificDate,
      multiplier: doc.multiplier || 1,
      bonusPoints: doc.bonusPoints,
      isActive: doc.isActive ?? true,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    }
  }

  private mapClientMission(doc: any): ClientMissionRecord {
    return {
      id: doc._id.toString(),
      clientId: String(doc.clientId || ''),
      missionId: String(doc.missionId || ''),
      progress: doc.progress || 0,
      status: doc.status || 'active',
      completedAt: doc.completedAt ? new Date(doc.completedAt).toISOString() : undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    }
  }

  private mapGameConfig(doc: any): GameConfigRecord {
    return {
      id: String(doc.id || doc._id || ''),
      name: doc.name || '',
      icon: doc.icon || 'roulette',
      enabled: doc.enabled ?? true,
      startHour: doc.startHour ?? 0,
      endHour: doc.endHour ?? 23,
      maxPlaysPerDay: doc.maxPlaysPerDay ?? 1,
      minPointsRequired: doc.minPointsRequired ?? 0,
      rewards: Array.isArray(doc.rewards)
        ? doc.rewards.map((reward: any) => ({
            id: String(reward.id || ''),
            name: reward.name || '',
            points: typeof reward.points === 'number' ? reward.points : Number.parseFloat(String(reward.points ?? 0)) || 0,
            probability:
              typeof reward.probability === 'number'
                ? reward.probability
                : typeof reward.pourcentage === 'number'
                  ? reward.pourcentage
                  : typeof reward.percentage === 'number'
                    ? reward.percentage
                    : Number.parseFloat(String(reward.probability ?? reward.pourcentage ?? reward.percentage ?? 0)) || 0,
            color: reward.color || '#64748b',
            type: reward.type === 'discount' || reward.type === 'free_item' || reward.type === 'points' ? reward.type : undefined,
            value: typeof reward.value === 'number' ? reward.value : Number.parseFloat(String(reward.value ?? reward.points ?? 0)) || 0,
            wheelSegment:
              typeof reward.wheelSegment === 'number'
                ? reward.wheelSegment
                : typeof reward.wheel_segment === 'number'
                  ? reward.wheel_segment
                  : Number.parseInt(String(reward.wheelSegment ?? reward.wheel_segment ?? 0), 10) || 0,
          }))
        : [],
    }
  }

  private mapGamePlay(doc: any): GamePlayRecord {
    return {
      id: doc._id.toString(),
      clientId: String(doc.clientId || ''),
      gameType: doc.gameType || 'roulette',
      result: doc.result || 'lose',
      prize: doc.prize
        ? {
            type: doc.prize.type || 'points',
            value: doc.prize.value || 0,
            description: doc.prize.description || '',
          }
        : undefined,
      playedAt: doc.playedAt ? new Date(doc.playedAt).toISOString() : new Date().toISOString(),
    }
  }

  private getDefaultLoyaltyCardConfigs(): LoyaltyCardConfigRecord[] {
    const now = new Date().toISOString()

    return [
      {
        id: 'card-cafe-1',
        name: 'Passeport Cafe',
        description: 'Cumulez vos cafes et tentez votre chance',
        productName: 'Cafe Importe',
        productPrice: 2,
        eligibleProductIds: [],
        totalStamps: 18,
        stampPositions: Array.from({ length: 18 }, (_, index) => {
          const position = index + 1
          if (position === 6 || position === 12) {
            return {
              position,
              type: 'game' as const,
              gameConfig: {
                gameName: 'Chich Bich',
                chances: 3,
                winCondition: 'double-6' as const,
                rewardProductIds: [],
              },
            }
          }

          if (position === 18) {
            return {
              position,
              type: 'reward' as const,
              rewardConfig: {
                rewardProductIds: [],
                rewardText: 'Cafe Offert',
              },
            }
          }

          return { position, type: 'normal' as const }
        }),
        expirationDays: 90,
        backgroundColor: 'light',
        stampIcon: 'cup',
        gridColumns: 4,
        isActive: true,
        autoRenew: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'card-formule-1',
        name: 'Passeport Formule',
        description: 'Cumulez vos formules et gagnez des recompenses',
        productName: 'Formule Importee',
        productPrice: 4.3,
        eligibleProductIds: [],
        totalStamps: 18,
        stampPositions: Array.from({ length: 18 }, (_, index) => {
          const position = index + 1
          if (position === 6 || position === 12) {
            return {
              position,
              type: 'game' as const,
              gameConfig: {
                gameName: 'Chich Bich',
                chances: 3,
                winCondition: 'double-6' as const,
                rewardProductIds: [],
              },
            }
          }

          if (position === 11) {
            return {
              position,
              type: 'reward' as const,
              rewardConfig: {
                rewardProductIds: [],
                rewardText: 'Boisson Chaude Offerte',
              },
            }
          }

          if (position === 18) {
            return {
              position,
              type: 'reward' as const,
              rewardConfig: {
                rewardProductIds: [],
                rewardText: 'Formule Offerte',
              },
            }
          }

          return { position, type: 'normal' as const }
        }),
        expirationDays: 90,
        backgroundColor: 'light',
        stampIcon: 'croissant',
        gridColumns: 4,
        isActive: true,
        autoRenew: true,
        createdAt: now,
        updatedAt: now,
      },
    ]
  }

  private mapLoyaltyCardConfig(doc: any): LoyaltyCardConfigRecord {
    return {
      id: String(doc.id || doc._id || ''),
      name: doc.name || '',
      description: doc.description || '',
      productName: doc.productName || '',
      productPrice: Number(doc.productPrice || 0),
      eligibleProductIds: Array.isArray(doc.eligibleProductIds) ? doc.eligibleProductIds.map(String) : [],
      totalStamps: Number(doc.totalStamps || 0),
      stampPositions: Array.isArray(doc.stampPositions)
        ? doc.stampPositions.map((position: any) => ({
            position: Number(position.position || 0),
            type: position.type || 'normal',
            gameConfig: position.gameConfig
              ? {
                  gameName: position.gameConfig.gameName || 'Chich Bich',
                  chances: Number(position.gameConfig.chances || 3),
                  winCondition: position.gameConfig.winCondition || 'double-6',
                  rewardProductIds: Array.isArray(position.gameConfig.rewardProductIds)
                    ? position.gameConfig.rewardProductIds.map(String)
                    : [],
                }
              : undefined,
            rewardConfig: position.rewardConfig
              ? {
                  rewardProductIds: Array.isArray(position.rewardConfig.rewardProductIds)
                    ? position.rewardConfig.rewardProductIds.map(String)
                    : [],
                  rewardText: position.rewardConfig.rewardText || '',
                }
              : undefined,
          }))
        : [],
      expirationDays: Number(doc.expirationDays || 90),
      backgroundColor: doc.backgroundColor === 'dark' ? 'dark' : 'light',
      stampIcon: doc.stampIcon || 'cup',
      customStampImage: doc.customStampImage,
      gridColumns: Number(doc.gridColumns || 4),
      isActive: doc.isActive ?? true,
      autoRenew: doc.autoRenew ?? true,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    }
  }

  private mapLoyaltyCustomerCard(doc: any): LoyaltyCustomerCardRecord {
    return {
      id: String(doc.id || doc._id || ''),
      configId: String(doc.configId || ''),
      visitorId: String(doc.visitorId || ''),
      stamps: Array.isArray(doc.stamps)
        ? doc.stamps.map((stamp: any) => ({
            position: Number(stamp.position || 0),
            stampedAt: stamp.stampedAt ? new Date(stamp.stampedAt).toISOString() : new Date().toISOString(),
            orderId: String(stamp.orderId || ''),
            productId: String(stamp.productId || ''),
            productName: stamp.productName || '',
            gameResult: stamp.gameResult
              ? {
                  played: Boolean(stamp.gameResult.played),
                  won: Boolean(stamp.gameResult.won),
                  diceResults: Array.isArray(stamp.gameResult.diceResults)
                    ? stamp.gameResult.diceResults.map((dice: any) => [Number(dice[0] || 0), Number(dice[1] || 0)] as [number, number])
                    : [],
                  finalDice: Array.isArray(stamp.gameResult.finalDice)
                    ? [Number(stamp.gameResult.finalDice[0] || 0), Number(stamp.gameResult.finalDice[1] || 0)]
                    : undefined,
                  rewardProductId: stamp.gameResult.rewardProductId ? String(stamp.gameResult.rewardProductId) : undefined,
                  playedAt: stamp.gameResult.playedAt
                    ? new Date(stamp.gameResult.playedAt).toISOString()
                    : new Date().toISOString(),
                }
              : undefined,
            rewardClaimed: stamp.rewardClaimed,
            rewardProductId: stamp.rewardProductId ? String(stamp.rewardProductId) : undefined,
          }))
        : [],
      currentStampCount: Number(doc.currentStampCount || 0),
      status: doc.status || 'active',
      expirationDate: doc.expirationDate ? new Date(doc.expirationDate).toISOString() : new Date().toISOString(),
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      completedAt: doc.completedAt ? new Date(doc.completedAt).toISOString() : undefined,
    }
  }

  private async ensureLoyaltyCardSettings() {
    const collection = this.loyaltyCardSettingsCollection()
    const existing = await collection.findOne({})
    if (existing) return existing

    const defaults = {
      isEnabled: true,
      cardConfigs: this.getDefaultLoyaltyCardConfigs(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await collection.insertOne(defaults)
    return collection.findOne({})
  }

  private async getLoyaltyCardSettingsDocument() {
    return (await this.ensureLoyaltyCardSettings()) || { isEnabled: true, cardConfigs: this.getDefaultLoyaltyCardConfigs() }
  }

  private async ensureDefaultMissions() {
    const collection = this.missionCollection()
    const count = await collection.countDocuments()
    if (count > 0) return
    await collection.insertMany(this.defaultMissions.map((mission) => ({ ...mission, validFrom: new Date(mission.validFrom), validUntil: new Date(mission.validUntil), createdAt: new Date(mission.createdAt) })))
  }

  private async ensureDefaultSpecialDays() {
    const collection = this.specialDaysCollection()
    const count = await collection.countDocuments()
    if (count > 0) return
    await collection.insertMany(this.defaultSpecialDays.map((day) => ({ ...day, createdAt: new Date(day.createdAt) })))
  }

  private async ensureDefaultGamesConfig() {
    const collection = this.gamesConfigCollection()
    const count = await collection.countDocuments()
    if (count > 0) return
    await collection.insertMany(this.defaultGamesConfig)
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

  async getMissions(): Promise<MissionRecord[]> {
    await this.ensureDefaultMissions()
    const docs = await this.missionCollection().find({}).sort({ createdAt: 1 }).toArray()
    return docs.map((doc) => this.mapMission(doc))
  }

  async createMission(actorId: string, mission: Omit<MissionRecord, 'id' | 'createdAt'>): Promise<MissionRecord> {
    await this.assertAdmin(actorId)
    const payload = {
      ...mission,
      validFrom: new Date(mission.validFrom),
      validUntil: new Date(mission.validUntil),
      createdAt: new Date(),
    }
    const result = await this.missionCollection().insertOne(payload)
    const created = await this.missionCollection().findOne({ _id: result.insertedId })
    return this.mapMission(created)
  }

  async updateMission(actorId: string, id: string, updates: Partial<Omit<MissionRecord, 'id' | 'createdAt'>>): Promise<MissionRecord> {
    await this.assertAdmin(actorId)
    const { ObjectId } = await import('mongodb')
    await this.missionCollection().updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          ...(updates.validFrom ? { validFrom: new Date(updates.validFrom) } : {}),
          ...(updates.validUntil ? { validUntil: new Date(updates.validUntil) } : {}),
        },
      }
    )
    const updated = await this.missionCollection().findOne({ _id: new ObjectId(id) })
    if (!updated) throw new Error('Mission non trouvee')
    return this.mapMission(updated)
  }

  async deleteMission(actorId: string, id: string): Promise<void> {
    await this.assertAdmin(actorId)
    const { ObjectId } = await import('mongodb')
    await this.missionCollection().deleteOne({ _id: new ObjectId(id) })
    await this.clientMissionsCollection().deleteMany({ missionId: id })
  }

  async getSpecialDays(): Promise<SpecialDayRecord[]> {
    await this.ensureDefaultSpecialDays()
    const docs = await this.specialDaysCollection().find({}).sort({ createdAt: 1 }).toArray()
    return docs.map((doc) => this.mapSpecialDay(doc))
  }

  async createSpecialDay(actorId: string, day: Omit<SpecialDayRecord, 'id' | 'createdAt'>): Promise<SpecialDayRecord> {
    await this.assertAdmin(actorId)
    const result = await this.specialDaysCollection().insertOne({
      ...day,
      createdAt: new Date(),
    })
    const created = await this.specialDaysCollection().findOne({ _id: result.insertedId })
    return this.mapSpecialDay(created)
  }

  async updateSpecialDay(actorId: string, id: string, updates: Partial<Omit<SpecialDayRecord, 'id' | 'createdAt'>>): Promise<SpecialDayRecord> {
    await this.assertAdmin(actorId)
    const { ObjectId } = await import('mongodb')
    await this.specialDaysCollection().updateOne({ _id: new ObjectId(id) }, { $set: updates })
    const updated = await this.specialDaysCollection().findOne({ _id: new ObjectId(id) })
    if (!updated) throw new Error('Journee speciale non trouvee')
    return this.mapSpecialDay(updated)
  }

  async deleteSpecialDay(actorId: string, id: string): Promise<void> {
    await this.assertAdmin(actorId)
    const { ObjectId } = await import('mongodb')
    await this.specialDaysCollection().deleteOne({ _id: new ObjectId(id) })
  }

  async getClientMissions(actorId: string): Promise<ClientMissionRecord[]> {
    const actor = await UserModel.findById(actorId)
    if (!actor) throw new Error('Utilisateur non trouve')
    const query = actor.role === 'admin' ? {} : { clientId: actorId }
    const docs = await this.clientMissionsCollection().find(query).sort({ createdAt: 1 }).toArray()
    return docs.map((doc) => this.mapClientMission(doc))
  }

  async saveClientMission(actorId: string, payload: Omit<ClientMissionRecord, 'id'> & { id?: string }): Promise<ClientMissionRecord> {
    await this.assertLoyaltyAccess(actorId, payload.clientId)
    const existing = await this.clientMissionsCollection().findOne({
      clientId: payload.clientId,
      missionId: payload.missionId,
    })

    if (existing) {
      await this.clientMissionsCollection().updateOne(
        { _id: existing._id },
        {
          $set: {
            progress: payload.progress,
            status: payload.status,
            completedAt: payload.completedAt ? new Date(payload.completedAt) : undefined,
          },
        }
      )
      const updated = await this.clientMissionsCollection().findOne({ _id: existing._id })
      return this.mapClientMission(updated)
    }

    const result = await this.clientMissionsCollection().insertOne({
      clientId: payload.clientId,
      missionId: payload.missionId,
      progress: payload.progress,
      status: payload.status,
      completedAt: payload.completedAt ? new Date(payload.completedAt) : undefined,
      createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
    })
    const created = await this.clientMissionsCollection().findOne({ _id: result.insertedId })
    return this.mapClientMission(created)
  }

  async getGamesConfig(): Promise<GameConfigRecord[]> {
    await this.ensureDefaultGamesConfig()
    const docs = await this.gamesConfigCollection().find({}).sort({ id: 1 }).toArray()
    return docs.map((doc) => this.mapGameConfig(doc))
  }

  async saveGamesConfig(actorId: string, configs: GameConfigRecord[]): Promise<GameConfigRecord[]> {
    await this.assertAdmin(actorId)
    const collection = this.gamesConfigCollection()
    await collection.deleteMany({})
    if (configs.length > 0) {
      await collection.insertMany(
        configs.map((config) => ({
          id: config.id,
          name: config.name,
          icon: config.icon,
          enabled: config.enabled,
          startHour: config.startHour,
          endHour: config.endHour,
          maxPlaysPerDay: config.maxPlaysPerDay,
          minPointsRequired: config.minPointsRequired,
          rewards: config.rewards.map((reward) => ({
            id: reward.id,
            name: reward.name,
            points: reward.points,
            probability: reward.probability,
            pourcentage: reward.probability,
            color: reward.color,
            type: reward.type,
            value: reward.value,
            wheelSegment: reward.wheelSegment,
            wheel_segment: reward.wheelSegment,
          })),
        }))
      )
    }
    return this.getGamesConfig()
  }

  async getGamePlays(actorId: string): Promise<GamePlayRecord[]> {
    const actor = await UserModel.findById(actorId)
    if (!actor) throw new Error('Utilisateur non trouve')
    const query = actor.role === 'admin' ? {} : { clientId: actorId }
    const docs = await this.gamePlaysCollection().find(query).sort({ playedAt: -1 }).toArray()
    return docs.map((doc) => this.mapGamePlay(doc))
  }

  async createGamePlay(
    actorId: string,
    payload: Omit<GamePlayRecord, 'id' | 'playedAt'> & { playedAt?: string }
  ): Promise<GamePlayRecord> {
    await this.assertLoyaltyAccess(actorId, payload.clientId)
    const result = await this.gamePlaysCollection().insertOne({
      clientId: payload.clientId,
      gameType: payload.gameType,
      result: payload.result,
      prize: payload.prize,
      playedAt: payload.playedAt ? new Date(payload.playedAt) : new Date(),
    })
    const created = await this.gamePlaysCollection().findOne({ _id: result.insertedId })
    return this.mapGamePlay(created)
  }

  async resetGamePlays(actorId: string, clientId?: string): Promise<void> {
    const actor = await UserModel.findById(actorId)
    if (!actor) throw new Error('Utilisateur non trouve')

    if (clientId && actor.role !== 'admin') {
      await this.assertLoyaltyAccess(actorId, clientId)
      await this.gamePlaysCollection().deleteMany({ clientId })
      return
    }

    if (actor.role !== 'admin') {
      await this.gamePlaysCollection().deleteMany({ clientId: actorId })
      return
    }

    await this.gamePlaysCollection().deleteMany(clientId ? { clientId } : {})
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

  async getLoyaltyCards(actorId: string, visitorId?: string): Promise<{
    isEnabled: boolean
    cardConfigs: LoyaltyCardConfigRecord[]
    customerCards: LoyaltyCustomerCardRecord[]
  }> {
    const actor = await UserModel.findById(actorId)
    if (!actor) {
      throw new Error('Utilisateur non trouve')
    }

    const settings = await this.getLoyaltyCardSettingsDocument()
    const cardConfigs = Array.isArray(settings.cardConfigs)
      ? settings.cardConfigs.map((config: any) => this.mapLoyaltyCardConfig(config))
      : this.getDefaultLoyaltyCardConfigs()

    const targetVisitorId = visitorId || actorId
    const query = actor.role === 'admin' ? (visitorId ? { visitorId } : {}) : { visitorId: actorId }
    const customerCards = (await this.loyaltyCustomerCardsCollection().find(query).sort({ createdAt: -1 }).toArray())
      .map((card) => this.mapLoyaltyCustomerCard(card))
      .filter((card) => actor.role === 'admin' || card.visitorId === targetVisitorId)

    return {
      isEnabled: settings.isEnabled ?? true,
      cardConfigs,
      customerCards,
    }
  }

  async updateLoyaltyCardSettings(
    actorId: string,
    payload: { isEnabled?: boolean; cardConfigs?: LoyaltyCardConfigRecord[] }
  ): Promise<{
    isEnabled: boolean
    cardConfigs: LoyaltyCardConfigRecord[]
  }> {
    await this.assertAdmin(actorId)

    const existing = await this.getLoyaltyCardSettingsDocument()
    const nextCardConfigs = Array.isArray(payload.cardConfigs)
      ? payload.cardConfigs.map((config) => this.mapLoyaltyCardConfig(config))
      : Array.isArray(existing.cardConfigs)
        ? existing.cardConfigs.map((config: any) => this.mapLoyaltyCardConfig(config))
        : this.getDefaultLoyaltyCardConfigs()

    const nextIsEnabled = typeof payload.isEnabled === 'boolean' ? payload.isEnabled : existing.isEnabled ?? true

    await this.loyaltyCardSettingsCollection().updateOne(
      { _id: existing._id },
      {
        $set: {
          isEnabled: nextIsEnabled,
          cardConfigs: nextCardConfigs,
          updatedAt: new Date(),
        },
      }
    )

    return {
      isEnabled: nextIsEnabled,
      cardConfigs: nextCardConfigs,
    }
  }

  async addLoyaltyCardStamp(
    actorId: string,
    payload: {
      visitorId: string
      orderId: string
      items: Array<{ productId: string; productName: string; quantity?: number }>
    }
  ): Promise<{
    stamped: boolean
    results: Array<{
      card: LoyaltyCustomerCardRecord
      position: number
      positionType: 'normal' | 'game' | 'reward'
    }>
  }> {
    await this.assertLoyaltyAccess(actorId, payload.visitorId)

    const settings = await this.getLoyaltyCardSettingsDocument()
    const cardConfigs = Array.isArray(settings.cardConfigs)
      ? settings.cardConfigs.map((config: any) => this.mapLoyaltyCardConfig(config))
      : []

    if (!(settings.isEnabled ?? true)) {
      return { stamped: false, results: [] }
    }

    const results: Array<{
      card: LoyaltyCustomerCardRecord
      position: number
      positionType: 'normal' | 'game' | 'reward'
    }> = []

    for (const item of payload.items) {
      const quantity = Math.max(1, Number(item.quantity || 1))
      for (let index = 0; index < quantity; index += 1) {
        const eligibleConfigs = cardConfigs.filter(
          (config) =>
            config.isActive &&
            config.eligibleProductIds.some((eligibleId) => {
              const normalizedEligibleId = String(eligibleId)
              const normalizedProductId = String(item.productId)
              return (
                normalizedEligibleId === normalizedProductId ||
                normalizedEligibleId === `breakfast-${normalizedProductId}` ||
                normalizedEligibleId.replace(/^breakfast-/, '') === normalizedProductId
              )
            })
        )

        for (const config of eligibleConfigs) {
          const now = new Date()
          const existingCardDoc = await this.loyaltyCustomerCardsCollection().findOne({
            visitorId: payload.visitorId,
            configId: config.id,
            status: 'active',
          })

          let card = existingCardDoc ? this.mapLoyaltyCustomerCard(existingCardDoc) : null

          if (!card) {
            const expirationDate = new Date(now)
            expirationDate.setDate(expirationDate.getDate() + config.expirationDays)
            const newCard: LoyaltyCustomerCardRecord = {
              id: `customer-card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              configId: config.id,
              visitorId: payload.visitorId,
              stamps: [],
              currentStampCount: 0,
              status: 'active',
              expirationDate: expirationDate.toISOString(),
              createdAt: now.toISOString(),
            }

            await this.loyaltyCustomerCardsCollection().insertOne({
              ...newCard,
              expirationDate: new Date(newCard.expirationDate),
              createdAt: new Date(newCard.createdAt),
            })
            card = newCard
          }

          const nextPosition = card.currentStampCount + 1
          if (nextPosition > config.totalStamps) {
            continue
          }

          const positionConfig = config.stampPositions.find((position) => position.position === nextPosition)
          const newStamp: LoyaltyCustomerStampRecord = {
            position: nextPosition,
            stampedAt: now.toISOString(),
            orderId: payload.orderId,
            productId: String(item.productId),
            productName: item.productName,
          }

          const updatedCard: LoyaltyCustomerCardRecord = {
            ...card,
            stamps: [...card.stamps, newStamp],
            currentStampCount: nextPosition,
            status: nextPosition >= config.totalStamps ? 'completed' : 'active',
            completedAt: nextPosition >= config.totalStamps ? now.toISOString() : undefined,
          }

          await this.loyaltyCustomerCardsCollection().updateOne(
            { id: updatedCard.id },
            {
              $set: {
                stamps: updatedCard.stamps,
                currentStampCount: updatedCard.currentStampCount,
                status: updatedCard.status,
                completedAt: updatedCard.completedAt ? new Date(updatedCard.completedAt) : undefined,
              },
            }
          )

          if (updatedCard.status === 'completed' && config.autoRenew) {
            const renewalExpiration = new Date(now)
            renewalExpiration.setDate(renewalExpiration.getDate() + config.expirationDays)
            await this.loyaltyCustomerCardsCollection().insertOne({
              id: `customer-card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              configId: config.id,
              visitorId: payload.visitorId,
              stamps: [],
              currentStampCount: 0,
              status: 'active',
              expirationDate: renewalExpiration,
              createdAt: now,
            })
          }

          results.push({
            card: updatedCard,
            position: nextPosition,
            positionType: positionConfig?.type || 'normal',
          })
        }
      }
    }

    return {
      stamped: results.length > 0,
      results,
    }
  }

  async playLoyaltyCardGame(
    actorId: string,
    payload: { cardId: string; position: number }
  ): Promise<LoyaltyCardGameResultRecord> {
    const cardDoc = await this.loyaltyCustomerCardsCollection().findOne({ id: payload.cardId })
    if (!cardDoc) {
      throw new Error('Carte introuvable')
    }

    const card = this.mapLoyaltyCustomerCard(cardDoc)
    await this.assertLoyaltyAccess(actorId, card.visitorId)

    const settings = await this.getLoyaltyCardSettingsDocument()
    const config = (Array.isArray(settings.cardConfigs) ? settings.cardConfigs : [])
      .map((entry: any) => this.mapLoyaltyCardConfig(entry))
      .find((entry) => entry.id === card.configId)

    if (!config) {
      throw new Error('Configuration de carte introuvable')
    }

    const positionConfig = config.stampPositions.find((position) => position.position === payload.position)
    const stamp = card.stamps.find((entry) => entry.position === payload.position)

    if (!positionConfig || positionConfig.type !== 'game' || !positionConfig.gameConfig || !stamp) {
      throw new Error('Position de jeu invalide')
    }

    if (stamp.gameResult?.played) {
      return stamp.gameResult
    }

    const rollDice = (): [number, number] => [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
    const hasWon = (dice: [number, number]) => {
      switch (positionConfig.gameConfig?.winCondition) {
        case 'double-any':
          return dice[0] === dice[1]
        case 'sum-12':
          return dice[0] + dice[1] === 12
        case 'double-6':
        default:
          return dice[0] === 6 && dice[1] === 6
      }
    }

    const diceResults: [number, number][] = []
    let finalDice: [number, number] | undefined
    let won = false

    for (let index = 0; index < positionConfig.gameConfig.chances; index += 1) {
      const dice = rollDice()
      diceResults.push(dice)
      finalDice = dice
      if (hasWon(dice)) {
        won = true
        break
      }
    }

    const gameResult: LoyaltyCardGameResultRecord = {
      played: true,
      won,
      diceResults,
      finalDice,
      rewardProductId: won ? positionConfig.gameConfig.rewardProductIds[0] : undefined,
      playedAt: new Date().toISOString(),
    }

    const updatedStamps = card.stamps.map((entry) =>
      entry.position === payload.position ? { ...entry, gameResult } : entry
    )

    await this.loyaltyCustomerCardsCollection().updateOne(
      { id: card.id },
      { $set: { stamps: updatedStamps } }
    )

    return gameResult
  }

  async claimLoyaltyCardReward(
    actorId: string,
    payload: { cardId: string; position: number; productId: string }
  ): Promise<boolean> {
    const cardDoc = await this.loyaltyCustomerCardsCollection().findOne({ id: payload.cardId })
    if (!cardDoc) {
      throw new Error('Carte introuvable')
    }

    const card = this.mapLoyaltyCustomerCard(cardDoc)
    await this.assertLoyaltyAccess(actorId, card.visitorId)

    const stamp = card.stamps.find((entry) => entry.position === payload.position)
    if (!stamp) {
      return false
    }

    await this.loyaltyCustomerCardsCollection().updateOne(
      { id: card.id, 'stamps.position': payload.position },
      {
        $set: {
          'stamps.$.rewardClaimed': true,
          'stamps.$.rewardProductId': payload.productId,
        },
      }
    )

    return true
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
