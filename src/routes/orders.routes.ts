import { Router } from 'express'
import { OrdersController } from '../controllers/orders.controller'
import { adminOnly, authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/config', OrdersController.getDeliveryConfig)
router.post('/', OrdersController.createOrder)

router.use(authMiddleware)

router.get('/my', OrdersController.getMyOrders)
router.get('/all', adminOnly, OrdersController.getAllOrders)
router.put('/config', adminOnly, OrdersController.updateDeliveryConfig)
router.patch('/:id/status', adminOnly, OrdersController.updateOrderStatus)
router.patch('/:id/cancel', adminOnly, OrdersController.cancelOrder)
router.patch('/:id/staff-note', adminOnly, OrdersController.addStaffNote)

export default router
