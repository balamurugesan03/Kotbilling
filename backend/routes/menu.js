const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItemById,
  getMenuItemsByCategory,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
  getCategories
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
const { authorize, requirePermission, PERMISSIONS } = require('../middleware/roleCheck');

router.use(protect);

router.get('/categories', getCategories);
router.get('/category/:category', getMenuItemsByCategory);
router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', requirePermission(PERMISSIONS.MANAGE_MENU), createMenuItem);
router.put('/:id', requirePermission(PERMISSIONS.MANAGE_MENU), updateMenuItem);
router.patch('/:id/availability', requirePermission(PERMISSIONS.MANAGE_MENU), toggleAvailability);
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_MENU), deleteMenuItem);

module.exports = router;
