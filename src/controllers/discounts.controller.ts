import type { Request, Response } from 'express'
import { discountsService } from '../services/discounts.service'

export const DiscountsController = {
  async getConfig(_req: Request, res: Response) {
    try {
      const config = await discountsService.getConfig()
      res.json({ success: true, data: config })
    } catch (error) {
      console.error('Get discount config error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des remises' })
    }
  },

  async updateConfig(req: Request, res: Response) {
    try {
      const config = await discountsService.updateConfig(req.body)
      res.json({ success: true, data: config, message: 'Remises mises a jour' })
    } catch (error: any) {
      console.error('Update discount config error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour des remises' })
    }
  },
}
