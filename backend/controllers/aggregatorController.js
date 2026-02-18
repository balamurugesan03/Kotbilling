const AggregatorConfig = require('../models/AggregatorConfig');
const Order = require('../models/Order');
const KitchenItem = require('../models/KitchenItem');
const MenuItem = require('../models/MenuItem');
const { verifyWebhookSignature, getSignatureFromHeaders } = require('../services/webhookVerifier');
const { mapSwiggyOrder, mapZomatoOrder } = require('../services/orderMapper');
const { notifyPlatformStatus, testPlatformConnection } = require('../services/statusCallback');

// @desc    Handle Swiggy webhook
// @route   POST /api/aggregator/webhook/swiggy
// @access  Public (HMAC verified)
const handleSwiggyWebhook = async (req, res) => {
  try {
    const config = await AggregatorConfig.findOne({ platform: 'swiggy' });
    if (!config || !config.isEnabled) {
      return res.status(403).json({ message: 'Swiggy integration is disabled' });
    }

    const signature = getSignatureFromHeaders(req.headers, 'swiggy');
    const rawBody = req.body;

    if (config.webhookSecret) {
      const isValid = await verifyWebhookSignature('swiggy', rawBody, signature);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
      }
    }

    const payload = JSON.parse(rawBody.toString());
    const orderData = await mapSwiggyOrder(payload);

    // Check for duplicate platform order
    const existing = await Order.findOne({ platformOrderId: orderData.platformOrderId, platform: 'swiggy' });
    if (existing) {
      return res.status(200).json({ message: 'Order already exists', orderId: existing._id });
    }

    const order = await Order.create(orderData);

    // Create kitchen items
    for (const item of order.items) {
      await KitchenItem.create({
        order: order._id,
        orderNumber: order.orderNumber,
        orderItemId: item._id,
        itemName: item.name,
        quantity: item.quantity,
        notes: item.notes,
        isOnline: true,
        platform: 'swiggy'
      });
    }

    const io = req.app.get('io');
    io.emit('new-online-order', order);
    io.emit('kitchen-updated', { type: 'new-order', order });

    // Auto-accept if enabled
    if (config.autoAccept) {
      order.status = 'preparing';
      await order.save();
      io.emit('order-status-updated', order);
      notifyPlatformStatus('swiggy', orderData.platformOrderId, 'preparing');
    }

    res.status(200).json({ message: 'Order received', orderId: order._id });
  } catch (error) {
    console.error('Swiggy webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// @desc    Handle Zomato webhook
// @route   POST /api/aggregator/webhook/zomato
// @access  Public (HMAC verified)
const handleZomatoWebhook = async (req, res) => {
  try {
    const config = await AggregatorConfig.findOne({ platform: 'zomato' });
    if (!config || !config.isEnabled) {
      return res.status(403).json({ message: 'Zomato integration is disabled' });
    }

    const signature = getSignatureFromHeaders(req.headers, 'zomato');
    const rawBody = req.body;

    if (config.webhookSecret) {
      const isValid = await verifyWebhookSignature('zomato', rawBody, signature);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
      }
    }

    const payload = JSON.parse(rawBody.toString());
    const orderData = await mapZomatoOrder(payload);

    // Check for duplicate platform order
    const existing = await Order.findOne({ platformOrderId: orderData.platformOrderId, platform: 'zomato' });
    if (existing) {
      return res.status(200).json({ message: 'Order already exists', orderId: existing._id });
    }

    const order = await Order.create(orderData);

    // Create kitchen items
    for (const item of order.items) {
      await KitchenItem.create({
        order: order._id,
        orderNumber: order.orderNumber,
        orderItemId: item._id,
        itemName: item.name,
        quantity: item.quantity,
        notes: item.notes,
        isOnline: true,
        platform: 'zomato'
      });
    }

    const io = req.app.get('io');
    io.emit('new-online-order', order);
    io.emit('kitchen-updated', { type: 'new-order', order });

    // Auto-accept if enabled
    if (config.autoAccept) {
      order.status = 'preparing';
      await order.save();
      io.emit('order-status-updated', order);
      notifyPlatformStatus('zomato', orderData.platformOrderId, 'preparing');
    }

    res.status(200).json({ message: 'Order received', orderId: order._id });
  } catch (error) {
    console.error('Zomato webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// @desc    Get all aggregator configs (credentials masked)
// @route   GET /api/aggregator/config
// @access  Private (MANAGE_AGGREGATORS)
const getAllConfigs = async (req, res) => {
  try {
    const configs = await AggregatorConfig.find({});
    const masked = configs.map(maskConfig);
    res.json(masked);
  } catch (error) {
    console.error('Get configs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single platform config
// @route   GET /api/aggregator/config/:platform
// @access  Private (MANAGE_AGGREGATORS)
const getConfig = async (req, res) => {
  try {
    const { platform } = req.params;
    if (!['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    let config = await AggregatorConfig.findOne({ platform });
    if (!config) {
      // Return default empty config
      config = { platform, isEnabled: false, apiKey: '', storeId: '', autoAccept: false, defaultPrepTime: 20, connectionStatus: 'disconnected', menuOverrides: [] };
    }

    res.json(maskConfig(config));
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upsert platform config
// @route   PUT /api/aggregator/config/:platform
// @access  Private (MANAGE_AGGREGATORS)
const upsertConfig = async (req, res) => {
  try {
    const { platform } = req.params;
    if (!['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const { isEnabled, apiKey, apiSecret, storeId, webhookSecret, autoAccept, defaultPrepTime, platformBaseUrl } = req.body;

    const updateData = {};
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (apiSecret !== undefined) updateData.apiSecret = apiSecret;
    if (storeId !== undefined) updateData.storeId = storeId;
    if (webhookSecret !== undefined) updateData.webhookSecret = webhookSecret;
    if (autoAccept !== undefined) updateData.autoAccept = autoAccept;
    if (defaultPrepTime !== undefined) updateData.defaultPrepTime = defaultPrepTime;
    if (platformBaseUrl !== undefined) updateData.platformBaseUrl = platformBaseUrl;

    const config = await AggregatorConfig.findOneAndUpdate(
      { platform },
      { $set: { ...updateData, platform } },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(maskConfig(config));
  } catch (error) {
    console.error('Upsert config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Test platform connection
// @route   POST /api/aggregator/config/:platform/test
// @access  Private (MANAGE_AGGREGATORS)
const testConnection = async (req, res) => {
  try {
    const { platform } = req.params;
    if (!['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const result = await testPlatformConnection(platform);
    res.json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get menu items with platform overrides
// @route   GET /api/aggregator/menu/:platform
// @access  Private (MANAGE_AGGREGATORS)
const getMenuWithOverrides = async (req, res) => {
  try {
    const { platform } = req.params;
    if (!['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const menuItems = await MenuItem.find({}).sort({ category: 1, name: 1 });
    const config = await AggregatorConfig.findOne({ platform });
    const overrides = config?.menuOverrides || [];

    const overrideMap = {};
    overrides.forEach(o => {
      overrideMap[o.menuItem.toString()] = o;
    });

    const result = menuItems.map(item => ({
      _id: item._id,
      name: item.name,
      category: item.category,
      basePrice: item.price,
      isVeg: item.isVeg,
      available: item.available,
      platformPrice: overrideMap[item._id.toString()]?.platformPrice ?? null,
      platformAvailable: overrideMap[item._id.toString()]?.isAvailable ?? true
    }));

    res.json(result);
  } catch (error) {
    console.error('Get menu overrides error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save menu price/availability overrides
// @route   PUT /api/aggregator/menu/:platform/overrides
// @access  Private (MANAGE_AGGREGATORS)
const saveMenuOverrides = async (req, res) => {
  try {
    const { platform } = req.params;
    if (!['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const { overrides } = req.body;
    if (!Array.isArray(overrides)) {
      return res.status(400).json({ message: 'overrides must be an array' });
    }

    const menuOverrides = overrides.map(o => ({
      menuItem: o.menuItemId,
      platformPrice: o.platformPrice ?? null,
      isAvailable: o.isAvailable !== undefined ? o.isAvailable : true
    }));

    const config = await AggregatorConfig.findOneAndUpdate(
      { platform },
      { $set: { menuOverrides, platform } },
      { upsert: true, new: true }
    );

    res.json({ message: 'Overrides saved', count: menuOverrides.length });
  } catch (error) {
    console.error('Save overrides error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Push menu to platform (stub)
// @route   POST /api/aggregator/menu/:platform/sync
// @access  Private (MANAGE_AGGREGATORS)
const syncMenuToPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    if (!['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const config = await AggregatorConfig.findOne({ platform });
    if (!config || !config.isEnabled) {
      return res.status(400).json({ message: `${platform} integration is not enabled` });
    }

    // Stub: In production, push menu to platform API
    await AggregatorConfig.updateOne(
      { platform },
      { lastSyncAt: new Date() }
    );

    res.json({
      message: `Menu sync initiated for ${platform}`,
      lastSyncAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Menu sync error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get platform-wise analytics
// @route   GET /api/aggregator/analytics
// @access  Private (VIEW_AGGREGATOR_STATS)
const getAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};

    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const matchStage = { type: 'online' };
    if (from || to) matchStage.createdAt = dateFilter;

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$platform',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    const dailyTrend = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            platform: '$platform'
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    const result = {
      swiggy: stats.find(s => s._id === 'swiggy') || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, completedOrders: 0, cancelledOrders: 0 },
      zomato: stats.find(s => s._id === 'zomato') || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, completedOrders: 0, cancelledOrders: 0 },
      dailyTrend
    };

    res.json(result);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Notify platform of order status change
// @route   POST /api/aggregator/orders/:id/notify
// @access  Private (ACCEPT_ONLINE_ORDERS)
const notifyStatusChange = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.platform || !order.platformOrderId) {
      return res.status(400).json({ message: 'Not a platform order' });
    }

    const result = await notifyPlatformStatus(
      order.platform,
      order.platformOrderId,
      order.status,
      req.body.extraData || {}
    );

    res.json(result);
  } catch (error) {
    console.error('Notify status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mask sensitive fields in config response
 */
const maskConfig = (config) => {
  const obj = config.toJSON ? config.toJSON() : { ...config };
  if (obj.apiKey) {
    obj.apiKey = obj.apiKey.length > 4
      ? '****' + obj.apiKey.slice(-4)
      : '****';
  }
  delete obj.apiSecret;
  delete obj.webhookSecret;
  return obj;
};

module.exports = {
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
};
