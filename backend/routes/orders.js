const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  addItemsToOrder,
  processPayment,
  getOnlineOrders,
  acceptOnlineOrder,
  getKitchenItems,
  updateKitchenItemStatus,
  releaseOrderTable
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/roleCheck');

router.use(protect);

// Kitchen routes
router.get('/kitchen', requirePermission(PERMISSIONS.VIEW_KITCHEN), getKitchenItems);
router.patch('/kitchen/:id/status', requirePermission(PERMISSIONS.UPDATE_KITCHEN_STATUS), updateKitchenItemStatus);

// Online order routes
router.get('/online', requirePermission(PERMISSIONS.VIEW_ONLINE_ORDERS), getOnlineOrders);
router.post('/:id/accept', requirePermission(PERMISSIONS.ACCEPT_ONLINE_ORDERS), acceptOnlineOrder);

// Order CRUD
router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.post('/', requirePermission(PERMISSIONS.CREATE_ORDER), createOrder);
router.patch('/:id/status', requirePermission(PERMISSIONS.EDIT_ORDER), updateOrderStatus);
router.post('/:id/items', requirePermission(PERMISSIONS.EDIT_ORDER), addItemsToOrder);
router.post('/:id/payment', requirePermission(PERMISSIONS.PROCESS_PAYMENT), processPayment);
router.post('/:id/release-table', requirePermission(PERMISSIONS.MANAGE_TABLES), releaseOrderTable);

module.exports = router;
