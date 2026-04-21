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
        return res.status(401).json({ error: 'Non authentifié' })
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
        return res.status(401).json({ error: 'Non authentifié' })
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
        return res.status(401).json({ error: 'Non authentifié' })
      }
      
      const { oldPassword, newPassword } = req.body
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' })
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
      }
      
      await authService.changePassword(req.user.id, oldPassword, newPassword)
      res.json({ message: 'Mot de passe modifié avec succès' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },
  
  async getLoyaltyStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' })
      }
      
      const stats = await authService.getLoyaltyStats(req.user.id)
      res.json(stats)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(404).json({ error: message })
    }
  }
}