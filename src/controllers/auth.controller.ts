import type { Request, Response } from 'express'
import { authService } from '../services/auth.service'

export const AuthController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' })
      }

      const result = await authService.login({ email, password })
      res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(401).json({ error: message })
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { email, password, name, phone, referralCode } = req.body

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, mot de passe et nom requis' })
      }

      const result = await authService.register({ email, password, name, phone, referralCode })
      res.status(201).json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const user = await authService.getMe(req.user.id)
      res.json({ user })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(404).json({ error: message })
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { name, phone } = req.body
      const user = await authService.updateProfile(req.user.id, { name, phone })
      res.json({ user })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { oldPassword, newPassword } = req.body

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caracteres' })
      }

      await authService.changePassword(req.user.id, oldPassword, newPassword)
      res.json({ message: 'Mot de passe modifie avec succes' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async getLoyaltyStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const stats = await authService.getLoyaltyStats(req.user.id)
      res.json(stats)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(404).json({ error: message })
    }
  },

  async getReferralConfig(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const config = await authService.getReferralConfig()
      res.json({ config })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async getMissions(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const missions = await authService.getMissions()
      res.json({ missions })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async createMission(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const mission = await authService.createMission(req.user.id, req.body)
      res.status(201).json({ mission })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async updateMission(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const mission = await authService.updateMission(req.user.id, req.params.id as any, req.body)
      res.json({ mission })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async deleteMission(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      await authService.deleteMission(req.user.id, req.params.id as any)
      res.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async getSpecialDays(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const specialDays = await authService.getSpecialDays()
      res.json({ specialDays })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async createSpecialDay(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const specialDay = await authService.createSpecialDay(req.user.id, req.body)
      res.status(201).json({ specialDay })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async updateSpecialDay(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const specialDay = await authService.updateSpecialDay(req.user.id, req.params.id as any, req.body)
      res.json({ specialDay })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async deleteSpecialDay(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      await authService.deleteSpecialDay(req.user.id, req.params.id as any)
      res.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async getClientMissions(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const clientMissions = await authService.getClientMissions(req.user.id)
      res.json({ clientMissions })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async saveClientMission(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const clientMission = await authService.saveClientMission(req.user.id, req.body)
      res.json({ clientMission })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async getGamesConfig(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const gamesConfig = await authService.getGamesConfig()
      res.json({ gamesConfig })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async saveGamesConfig(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { gamesConfig } = req.body
      if (!Array.isArray(gamesConfig)) {
        return res.status(400).json({ error: 'gamesConfig invalide' })
      }

      const savedGamesConfig = await authService.saveGamesConfig(req.user.id, gamesConfig)
      res.json({ gamesConfig: savedGamesConfig })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async getGamePlays(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const gamePlays = await authService.getGamePlays(req.user.id)
      res.json({ gamePlays })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async createGamePlay(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { clientId, gameType, result, prize, playedAt } = req.body
      if (!clientId || !gameType || !result) {
        return res.status(400).json({ error: 'clientId, gameType et result requis' })
      }

      const gamePlay = await authService.createGamePlay(req.user.id, {
        clientId,
        gameType,
        result,
        prize,
        playedAt,
      })
      res.status(201).json({ gamePlay })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async resetGamePlays(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined
      await authService.resetGamePlays(req.user.id, clientId)
      res.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async updateReferralConfig(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acces refuse' })
      }

      const { referrerReward, referredReward } = req.body
      if (
        typeof referrerReward !== 'number' ||
        referrerReward < 0 ||
        typeof referredReward !== 'number' ||
        referredReward < 0
      ) {
        return res.status(400).json({ error: 'Configuration de parrainage invalide' })
      }

      const config = await authService.updateReferralConfig({ referrerReward, referredReward })
      res.json({ config })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async getLoyaltyCards(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const visitorId = typeof req.query.visitorId === 'string' ? req.query.visitorId : undefined
      const result = await authService.getLoyaltyCards(req.user.id, visitorId)
      res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async updateLoyaltyCardSettings(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const result = await authService.updateLoyaltyCardSettings(req.user.id, {
        isEnabled: req.body.isEnabled,
        cardConfigs: req.body.cardConfigs,
      })
      res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async addLoyaltyCardStamp(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { visitorId, orderId, items } = req.body
      if (!visitorId || !orderId || !Array.isArray(items)) {
        return res.status(400).json({ error: 'visitorId, orderId et items requis' })
      }

      const result = await authService.addLoyaltyCardStamp(req.user.id, { visitorId, orderId, items })
      res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async playLoyaltyCardGame(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { cardId, position } = req.body
      if (!cardId || typeof position !== 'number') {
        return res.status(400).json({ error: 'cardId et position requis' })
      }

      const gameResult = await authService.playLoyaltyCardGame(req.user.id, { cardId, position })
      res.json({ gameResult })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async claimLoyaltyCardReward(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { cardId, position, productId } = req.body
      if (!cardId || typeof position !== 'number' || !productId) {
        return res.status(400).json({ error: 'cardId, position et productId requis' })
      }

      const success = await authService.claimLoyaltyCardReward(req.user.id, { cardId, position, productId })
      res.json({ success })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async awardLoyaltyPoints(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { userId, points, description, totalSpent, totalOrdersIncrement, lastVisit } = req.body
      if (!userId || typeof points !== 'number' || !description) {
        return res.status(400).json({ error: 'userId, points et description requis' })
      }

      const user = await authService.awardLoyaltyPoints(req.user.id, {
        userId,
        points,
        description,
        totalSpent,
        totalOrdersIncrement,
        lastVisit,
      })

      res.json({ user })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async updateLoyaltyClient(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { userId, totalSpent, totalOrders, lastVisit, walletBalance } = req.body
      if (!userId) {
        return res.status(400).json({ error: 'userId requis' })
      }

      const user = await authService.updateLoyaltyClient(req.user.id, {
        userId,
        totalSpent,
        totalOrders,
        lastVisit,
        walletBalance,
      })

      res.json({ user })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async getEmployees(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const employees = await authService.getEmployees(req.user.id)
      res.json({ employees })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(403).json({ error: message })
    }
  },

  async getClients(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const clients = await authService.getClients(req.user.id)
      res.json({ clients })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(403).json({ error: message })
    }
  },

  async createClient(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { email, password, name, phone, loyaltyPoints, loyaltyTier, totalSpent } = req.body

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, mot de passe et nom requis' })
      }

      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caracteres' })
      }

      const client = await authService.createClient(req.user.id, {
        email,
        password,
        name,
        phone,
        loyaltyPoints: typeof loyaltyPoints === 'number' ? loyaltyPoints : Number(loyaltyPoints) || 0,
        loyaltyTier,
        totalSpent: typeof totalSpent === 'number' ? totalSpent : Number(totalSpent) || 0,
      })

      res.status(201).json({ client })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async getReferrals(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const referrals = await authService.getReferrals(req.user.id)
      res.json({ referrals })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(403).json({ error: message })
    }
  },

  async validateReferralFirstPurchase(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { purchaseAmount } = req.body
      if (typeof purchaseAmount !== 'number' || purchaseAmount <= 0) {
        return res.status(400).json({ error: 'purchaseAmount invalide' })
      }

      await authService.validateReferralFirstPurchase(req.params.id as any, purchaseAmount)
      res.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async createEmployee(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const { email, password, name, phone, employeeRole, permissions, isActive } = req.body

      if (!email || !password || !name || !employeeRole) {
        return res.status(400).json({ error: 'Email, mot de passe, nom et role requis' })
      }

      const employee = await authService.createEmployee(req.user.id, {
        email,
        password,
        name,
        phone,
        employeeRole,
        permissions: Array.isArray(permissions) ? permissions : [],
        isActive,
      })

      res.status(201).json({ employee })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async updateEmployee(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      const employee = await authService.updateEmployee(req.user.id, req.params.id as any, req.body)
      res.json({ employee })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },

  async deleteEmployee(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifie' })
      }

      await authService.deleteEmployee(req.user.id, req.params.id as any)
      res.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },
}
