import type { Request, Response } from 'express'
import { ordersService } from '../services/orders.service'
import type { DeliveryMode, PaymentMethod, OrderStatus } from '../models/RemoteOrder.model'

function parseString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

export const OrdersController = {
  async getDeliveryConfig(_req: Request, res: Response) {
    try {
      const config = await ordersService.getDeliveryConfig()
      res.json({ success: true, data: config })
    } catch (error) {
      console.error('Get delivery config error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation de la configuration' })
    }
  },

  async updateDeliveryConfig(req: Request, res: Response) {
    try {
      const config = await ordersService.updateDeliveryConfig(req.body)
      res.json({ success: true, data: config, message: 'Configuration mise a jour' })
    } catch (error: any) {
      console.error('Update delivery config error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour' })
    }
  },

  async createOrder(req: Request, res: Response) {
    try {
      const body = req.body as Record<string, any>
      const items = Array.isArray(body.items) ? body.items : []
      if (items.length === 0) {
        return res.status(400).json({ success: false, error: 'Le panier est vide' })
      }

      const deliveryMode = body.deliveryMode as DeliveryMode
      const paymentMethod = body.paymentMethod as PaymentMethod

      if (!deliveryMode || !paymentMethod) {
        return res.status(400).json({ success: false, error: 'Mode de livraison et paiement requis' })
      }

      const order = await ordersService.createOrder({
        items,
        subtotal: Number(body.subtotal || 0),
        total: Number(body.total || 0),
        totalPoints: Number(body.totalPoints || 0),
        deliveryMode,
        paymentMethod,
        deliveryAddress: body.deliveryAddress,
        pickupTime: parseString(body.pickupTime),
        clientId: parseString(body.clientId),
        clientEmail: parseString(body.clientEmail),
        clientName: parseString(body.clientName),
        clientPhone: parseString(body.clientPhone),
        customerNote: parseString(body.customerNote),
      })

      res.status(201).json({ success: true, data: order, message: 'Commande creee avec succes' })
    } catch (error: any) {
      console.error('Create order error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la creation de la commande' })
    }
  },

  async getMyOrders(req: Request, res: Response) {
    try {
      if (!req.user?.email) {
        return res.status(401).json({ success: false, error: 'Non authentifie' })
      }

      const orders = await ordersService.getOrdersByClientEmail(req.user.email)
      res.json({ success: true, data: orders })
    } catch (error) {
      console.error('Get my orders error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des commandes' })
    }
  },

  async getAllOrders(_req: Request, res: Response) {
    try {
      const orders = await ordersService.getAllOrders()
      res.json({ success: true, data: orders })
    } catch (error) {
      console.error('Get all orders error:', error)
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des commandes' })
    }
  },

  async updateOrderStatus(req: Request, res: Response) {
    try {
      const id = parseString(req.params.id)
      const status = req.body?.status as OrderStatus | undefined
      if (!id || !status) {
        return res.status(400).json({ success: false, error: 'ID et statut requis' })
      }

      await ordersService.updateOrderStatus(id, status, req.user?.id)
      res.json({ success: true, message: 'Statut mis a jour avec succes' })
    } catch (error: any) {
      console.error('Update order status error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise a jour du statut' })
    }
  },

  async cancelOrder(req: Request, res: Response) {
    try {
      const id = parseString(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requis' })
      }

      await ordersService.cancelOrder(id, parseString(req.body?.reason))
      res.json({ success: true, message: 'Commande annulee avec succes' })
    } catch (error: any) {
      console.error('Cancel order error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de l annulation' })
    }
  },

  async addStaffNote(req: Request, res: Response) {
    try {
      const id = parseString(req.params.id)
      const note = parseString(req.body?.note)
      if (!id || !note) {
        return res.status(400).json({ success: false, error: 'ID et note requis' })
      }

      await ordersService.addStaffNote(id, note)
      res.json({ success: true, message: 'Note ajoutee avec succes' })
    } catch (error: any) {
      console.error('Add staff note error:', error)
      res.status(400).json({ success: false, error: error.message || 'Erreur lors de l ajout de la note' })
    }
  },
}
