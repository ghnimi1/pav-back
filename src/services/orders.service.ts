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
    const deliveryFee = data.deliveryMode === 'delivery'
      ? (data.subtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryFee)
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
      total: data.subtotal + deliveryFee,
    })

    await authService.validateReferralFirstPurchaseForClient(
      order.total,
      order.clientId,
      order.clientEmail
    )

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
  }

  async cancelOrder(id: string, reason?: string): Promise<void> {
    const order = await RemoteOrderModel.findById(id)
    if (!order) throw new Error('Commande non trouvee')

    await RemoteOrderModel.update(id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason,
    })
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
