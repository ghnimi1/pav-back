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

      const employee = await authService.updateEmployee(req.user.id, req.params.id, req.body)
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

      await authService.deleteEmployee(req.user.id, req.params.id)
      res.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur serveur'
      res.status(400).json({ error: message })
    }
  },
}
