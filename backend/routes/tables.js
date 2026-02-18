const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTableById,
  getTableStats,
  createTable,
  updateTable,
  updateTableStatus,
  reserveTable,
  releaseTable,
  deleteTable
} = require('../controllers/tableController');
const { protect } = require('../middleware/auth');
const { authorize, requirePermission, PERMISSIONS } = require('../middleware/roleCheck');

router.use(protect);

router.get('/stats', getTableStats);
router.get('/', requirePermission(PERMISSIONS.VIEW_TABLES), getAllTables);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_TABLES), getTableById);
router.post('/', authorize('admin'), createTable);
router.put('/:id', authorize('admin'), updateTable);
router.patch('/:id/status', requirePermission(PERMISSIONS.MANAGE_TABLES), updateTableStatus);
router.post('/:id/reserve', requirePermission(PERMISSIONS.MANAGE_TABLES), reserveTable);
router.post('/:id/release', requirePermission(PERMISSIONS.MANAGE_TABLES), releaseTable);
router.delete('/:id', authorize('admin'), deleteTable);

module.exports = router;
