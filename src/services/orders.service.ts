import {
  DeliveryConfigModel,
  RemoteOrderModel,
  type CreateRemoteOrderInput,
  type DeliveryConfig,
  type DeliveryConfigInput,
  type RemoteOrder,
  type OrderStatus,
} from '../models/RemoteOrder.model'
import { authService } from './auth.service'
import { notificationsService } from './notifications.service'

export class OrdersService {
  async getAllOrders(): Promise<RemoteOrder[]> {
    return RemoteOrderModel.findAll()
  }

  async getOrdersByClientEmail(clientEmail: string): Promise<RemoteOrder[]> {
    return RemoteOrderModel.findByClientEmail(clientEmail)
  }

  async getOrderById(id: string): Promise<RemoteOrder | null> {
    return RemoteOrderModel.findById(id)
  }

  async createOrder(data: Omit<CreateRemoteOrderInput, 'orderNumber' | 'estimatedTime' | 'deliveryFee'>): Promise<RemoteOrder> {
    const config = await DeliveryConfigModel.get()
    const discount = Math.max(0, Number(data.discount || 0))
    const discountedSubtotal = Math.max(0, data.subtotal - discount)
    const deliveryFee = data.deliveryMode === 'delivery'
      ? (discountedSubtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryFee)
      : 0
    const estimatedTime = data.deliveryMode === 'delivery'
      ? config.estimatedDeliveryTime
      : config.estimatedPickupTime

    if (data.subtotal < config.minOrderAmount) {
      throw new Error(`Commande minimum: ${config.minOrderAmount.toFixed(2)} TND`)
    }

    if (data.deliveryMode === 'delivery' && config.deliveryEnabled === false) {
      throw new Error('La livraison est actuellement indisponible')
    }

    if (data.deliveryMode === 'pickup' && config.pickupEnabled === false) {
      throw new Error('Le retrait est actuellement indisponible')
    }

    const orderNumber = await RemoteOrderModel.getNextOrderNumber()

    const order = await RemoteOrderModel.create({
      ...data,
      orderNumber,
      deliveryFee,
      estimatedTime,
      discount,
      total: discountedSubtotal + deliveryFee,
    })

    await authService.validateReferralFirstPurchaseForClient(
      order.total,
      order.clientId,
      order.clientEmail
    )

    await notificationsService.createAdmin({
      type: 'info',
      category: 'order',
      priority: 'high',
      title: 'Nouvelle commande',
      message: `${order.clientName || 'Client'} - ${order.total.toFixed(2)} TND`,
      actionUrl: '/admin/commandes',
      actionLabel: 'Voir',
      metadata: { orderId: order._id, amount: order.total },
    })

    return order
  }

  async updateOrderStatus(id: string, status: OrderStatus, staffId?: string): Promise<void> {
    const order = await RemoteOrderModel.findById(id)
    if (!order) throw new Error('Commande non trouvee')

    const now = new Date()
    const updates: Partial<RemoteOrder> = { status }

    if (status === 'confirmed') {
      updates.confirmedAt = now
      updates.confirmedBy = staffId
    } else if (status === 'ready') {
      updates.readyAt = now
    } else if (status === 'completed') {
      updates.completedAt = now
      updates.completedBy = staffId
    }

    await RemoteOrderModel.update(id, updates)

    if (order.clientId || order.clientEmail) {
      const statusLabels: Partial<Record<OrderStatus, string>> = {
        confirmed: 'Votre commande est confirmee',
        preparing: 'Votre commande est en preparation',
        ready: 'Votre commande est prete',
        delivering: 'Votre commande est en livraison',
        completed: 'Votre commande est terminee',
      }
      const title = statusLabels[status]
      if (title) {
        await notificationsService.createClient({
          type: status === 'completed' ? 'success' : 'info',
          category: 'order',
          priority: status === 'ready' ? 'high' : 'medium',
          title,
          message: `Commande ${order.orderNumber}`,
          actionUrl: '/commander',
          actionLabel: 'Voir mes commandes',
          recipientId: order.clientId,
          recipientEmail: order.clientEmail,
          metadata: { orderId: order._id || id },
        })
      }
    }
  }

  async cancelOrder(id: string, reason?: string): Promise<void> {
    const order = await RemoteOrderModel.findById(id)
    if (!order) throw new Error('Commande non trouvee')

    await RemoteOrderModel.update(id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason,
    })

    if (order.clientId || order.clientEmail) {
      await notificationsService.createClient({
        type: 'warning',
        category: 'order',
        priority: 'high',
        title: 'Commande annulee',
        message: reason ? `${order.orderNumber} - ${reason}` : `Commande ${order.orderNumber}`,
        actionUrl: '/commander',
        actionLabel: 'Voir mes commandes',
        recipientId: order.clientId,
        recipientEmail: order.clientEmail,
        metadata: { orderId: order._id || id },
      })
    }
  }

  async addStaffNote(id: string, note: string): Promise<void> {
    const order = await RemoteOrderModel.findById(id)
    if (!order) throw new Error('Commande non trouvee')
    await RemoteOrderModel.update(id, { staffNote: note })
  }

  async getDeliveryConfig(): Promise<DeliveryConfig> {
    return DeliveryConfigModel.get()
  }

  async updateDeliveryConfig(updates: DeliveryConfigInput): Promise<DeliveryConfig> {
    return DeliveryConfigModel.update(updates)
  }
}

export const ordersService = new OrdersService()
