import type { Request, Response } from 'express'
import { notificationsService } from '../services/notifications.service'
import type { NotificationCategory } from '../models/Notification.model'

function getUser(req: Request) {
  return {
    id: req.user?.id,
    email: req.user?.email,
    role: req.user?.role,
  }
}

export const NotificationsController = {
  async getMyNotifications(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit || 20)
      const skip = Number(req.query.skip || 0)
      const result = await notificationsService.getForUser(getUser(req), { limit, skip })
      res.json({ success: true, data: result })
    } catch (error) {
      console.error('Get notifications error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des notifications' })
    }
  },

  async createNotification(req: Request, res: Response) {
    try {
      const user = getUser(req)
      const notification = await notificationsService.create({
        ...req.body,
        recipientRole: user.role === 'admin' ? 'admin' : 'client',
        recipientId: user.role === 'admin' ? undefined : user.id,
        recipientEmail: user.role === 'admin' ? undefined : user.email,
      })
      res.status(201).json({ success: true, data: notification })
    } catch (error: any) {
      console.error('Create notification error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la creation' })
    }
  },

  async markAsRead(req: Request, res: Response) {
    try {
      await notificationsService.markAsRead(req.params.id)
      res.json({ success: true })
    } catch (error) {
      console.error('Mark notification read error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la mise a jour' })
    }
  },

  async markAllAsRead(req: Request, res: Response) {
    try {
      await notificationsService.markAllAsRead(getUser(req), req.body?.category as NotificationCategory | undefined)
      res.json({ success: true })
    } catch (error) {
      console.error('Mark notifications read error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la mise a jour' })
    }
  },

  async deleteNotification(req: Request, res: Response) {
    try {
      await notificationsService.delete(req.params.id)
      res.json({ success: true })
    } catch (error) {
      console.error('Delete notification error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la suppression' })
    }
  },

  async clearNotifications(req: Request, res: Response) {
    try {
      await notificationsService.clearForUser(getUser(req))
      res.json({ success: true })
    } catch (error) {
      console.error('Clear notifications error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la suppression' })
    }
  },
}
