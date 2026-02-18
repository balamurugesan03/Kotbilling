const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/roleCheck');
const {
  handleSwiggyWebhook,
  handleZomatoWebhook,
  getAllConfigs,
  getConfig,
  upsertConfig,
  testConnection,
  getMenuWithOverrides,
  saveMenuOverrides,
  syncMenuToPlatform,
  getAnalytics,
  notifyStatusChange
} = require('../controllers/aggregatorController');

// Webhook routes - Public (no auth, raw body for HMAC verification)
router.post('/webhook/swiggy', express.raw({ type: '*/*' }), handleSwiggyWebhook);
router.post('/webhook/zomato', express.raw({ type: '*/*' }), handleZomatoWebhook);

// All routes below require authentication and JSON parsing
router.use(express.json());
router.use(protect);

// Config routes
router.get('/config', requirePermission(PERMISSIONS.MANAGE_AGGREGATORS), getAllConfigs);
router.get('/config/:platform', requirePermission(PERMISSIONS.MANAGE_AGGREGATORS), getConfig);
router.put('/config/:platform', requirePermission(PERMISSIONS.MANAGE_AGGREGATORS), upsertConfig);
router.post('/config/:platform/test', requirePermission(PERMISSIONS.MANAGE_AGGREGATORS), testConnection);

// Menu sync routes
router.get('/menu/:platform', requirePermission(PERMISSIONS.MANAGE_AGGREGATORS), getMenuWithOverrides);
router.put('/menu/:platform/overrides', requirePermission(PERMISSIONS.MANAGE_AGGREGATORS), saveMenuOverrides);
router.post('/menu/:platform/sync', requirePermission(PERMISSIONS.MANAGE_AGGREGATORS), syncMenuToPlatform);

// Analytics
router.get('/analytics', requirePermission(PERMISSIONS.VIEW_AGGREGATOR_STATS), getAnalytics);

// Status notification
router.post('/orders/:id/notify', requirePermission(PERMISSIONS.ACCEPT_ONLINE_ORDERS), notifyStatusChange);

module.exports = router;
