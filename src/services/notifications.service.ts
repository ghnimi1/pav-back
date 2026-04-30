import { NotificationModel, type CreateAppNotificationInput, type NotificationCategory } from '../models/Notification.model'

export class NotificationsService {
  getForUser(user: { id?: string; email?: string; role?: string }, options?: { limit?: number; skip?: number }) {
    return NotificationModel.findForUser(user, options)
  }

  create(input: CreateAppNotificationInput) {
    return NotificationModel.create(input)
  }

  createAdmin(input: Omit<CreateAppNotificationInput, 'recipientRole'>) {
    return NotificationModel.create({ ...input, recipientRole: 'admin' })
  }

  createClient(input: Omit<CreateAppNotificationInput, 'recipientRole'>) {
    return NotificationModel.create({ ...input, recipientRole: 'client' })
  }

  markAsRead(id: string) {
    return NotificationModel.markAsRead(id)
  }

  markAllAsRead(user: { id?: string; email?: string; role?: string }, category?: NotificationCategory) {
    return NotificationModel.markAllAsRead(user, category)
  }

  delete(id: string) {
    return NotificationModel.delete(id)
  }

  clearForUser(user: { id?: string; email?: string; role?: string }) {
    return NotificationModel.clearForUser(user)
  }
}

export const notificationsService = new NotificationsService()
