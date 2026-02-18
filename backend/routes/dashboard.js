const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRunningOrders,
  getOnlineOrders,
  getKitchenPending,
  getLowStockAlerts,
  getDashboardData,
  getDailySalesReport,
  getWeeklySalesReport,
  getMonthlySalesReport
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getDashboardData);
router.get('/stats', getDashboardStats);
router.get('/running-orders', getRunningOrders);
router.get('/online-orders', getOnlineOrders);
router.get('/kitchen-pending', getKitchenPending);
router.get('/low-stock', getLowStockAlerts);

// Sales Reports
router.get('/sales/daily', getDailySalesReport);
router.get('/sales/weekly', getWeeklySalesReport);
router.get('/sales/monthly', getMonthlySalesReport);

module.exports = router;
