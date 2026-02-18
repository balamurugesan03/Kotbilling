const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getInventoryById,
  getLowStockItems,
  getInventoryStats,
  createInventoryItem,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/roleCheck');

router.use(protect);

router.get('/low-stock', getLowStockItems);
router.get('/stats', getInventoryStats);
router.get('/', getAllInventory);
router.get('/:id', getInventoryById);
router.post('/', requirePermission(PERMISSIONS.MANAGE_INVENTORY), createInventoryItem);
router.put('/:id', requirePermission(PERMISSIONS.MANAGE_INVENTORY), updateInventoryItem);
router.patch('/:id/stock', requirePermission(PERMISSIONS.MANAGE_INVENTORY), updateStock);
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_INVENTORY), deleteInventoryItem);

module.exports = router;
