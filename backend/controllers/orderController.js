const Order = require('../models/Order');
const Table = require('../models/Table');
const KitchenItem = require('../models/KitchenItem');

// Helper function to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Helper function to find order by _id or orderNumber
const findOrderById = async (id, populate = []) => {
  let query;

  if (isValidObjectId(id)) {
    query = Order.findById(id);
  } else {
    const orderNumber = parseInt(id, 10);
    if (isNaN(orderNumber)) return null;
    query = Order.findOne({ orderNumber });
  }

  populate.forEach(p => {
    query = query.populate(p.path, p.select);
  });

  return query;
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getAllOrders = async (req, res) => {
  try {
    const { type, status, date } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const orders = await Order.find(filter)
      .populate('table')
      .populate('waiter', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error.message, error.stack);
    res.status(500).json({
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order;

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isValidObjectId) {
      // Try to find by _id first
      order = await Order.findById(id)
        .populate('table')
        .populate('waiter', 'name');
    }

    // If not found or not a valid ObjectId, try finding by orderNumber
    if (!order) {
      const orderNumber = parseInt(id, 10);
      if (!isNaN(orderNumber)) {
        order = await Order.findOne({ orderNumber })
          .populate('table')
          .populate('waiter', 'name');
      }
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { type, tableId, items, customerName, customerPhone, platform, deliveryAddress } = req.body;

    const orderData = {
      type,
      items,
      customerName,
      customerPhone,
      waiter: req.user._id,
      waiterName: req.user.name,
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    // Handle dine-in orders
    if (type === 'dine_in' && tableId) {
      const table = await Table.findById(tableId);
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }
      orderData.table = tableId;
      orderData.tableNumber = table.number;
    }

    // Handle online orders
    if (type === 'online') {
      orderData.platform = platform;
      orderData.deliveryAddress = deliveryAddress;
    }

    const order = await Order.create(orderData);

    // Create kitchen items
    const kitchenItems = items.map(item => ({
      order: order._id,
      orderNumber: order.orderNumber,
      orderItemId: item._id,
      tableNumber: orderData.tableNumber || null,
      itemName: item.name,
      quantity: item.quantity,
      notes: item.notes || '',
      isOnline: type === 'online',
      platform: platform || null
    }));

    await KitchenItem.insertMany(kitchenItems);

    // Update table status for dine-in
    if (type === 'dine_in' && tableId) {
      await Table.findByIdAndUpdate(tableId, {
        status: 'occupied',
        currentOrderId: order._id
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('new-order', order);
    io.emit('kitchen-updated', { type: 'new-items', orderId: order._id });

    const populatedOrder = await Order.findById(order._id)
      .populate('table')
      .populate('waiter', 'name');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    let order;
    if (isValidObjectId(id)) {
      order = await Order.findById(id);
    } else {
      const orderNumber = parseInt(id, 10);
      if (!isNaN(orderNumber)) {
        order = await Order.findOne({ orderNumber });
      }
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    // If order completed or cancelled, release table
    if (['completed', 'cancelled'].includes(status) && order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'available',
        currentOrderId: null
      });
    }

    await order.save();

    // Emit socket event
    const io = req.app.get('io');
    io.emit('order-updated', order);

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add items to order
// @route   POST /api/orders/:id/items
// @access  Private
const addItemsToOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const { id } = req.params;

    let order;
    if (isValidObjectId(id)) {
      order = await Order.findById(id);
    } else {
      const orderNumber = parseInt(id, 10);
      if (!isNaN(orderNumber)) {
        order = await Order.findOne({ orderNumber });
      }
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Add new items
    order.items.push(...items);
    await order.save();

    // Create kitchen items for new items
    const kitchenItems = items.map(item => ({
      order: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber || null,
      itemName: item.name,
      quantity: item.quantity,
      notes: item.notes || '',
      isOnline: order.type === 'online',
      platform: order.platform || null
    }));

    await KitchenItem.insertMany(kitchenItems);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('order-updated', order);
    io.emit('kitchen-updated', { type: 'new-items', orderId: order._id });

    res.json(order);
  } catch (error) {
    console.error('Add items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Process payment
// @route   POST /api/orders/:id/payment
// @access  Private
const processPayment = async (req, res) => {
  try {
    const { paymentMethod, discount } = req.body;
    const { id } = req.params;

    let order;
    if (isValidObjectId(id)) {
      order = await Order.findById(id);
    } else {
      const orderNumber = parseInt(id, 10);
      if (!isNaN(orderNumber)) {
        order = await Order.findOne({ orderNumber });
      }
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'paid';
    order.status = 'completed';
    if (discount) order.discount = discount;

    await order.save();

    // Release table if dine-in
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'available',
        currentOrderId: null
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('order-updated', order);
    io.emit('table-updated', { tableId: order.table });

    res.json(order);
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get online orders
// @route   GET /api/orders/online
// @access  Private
const getOnlineOrders = async (req, res) => {
  try {
    const orders = await Order.find({ type: 'online' })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get online orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accept online order
// @route   POST /api/orders/:id/accept
// @access  Private
const acceptOnlineOrder = async (req, res) => {
  try {
    const { id } = req.params;

    let order;
    if (isValidObjectId(id)) {
      order = await Order.findById(id);
    } else {
      const orderNumber = parseInt(id, 10);
      if (!isNaN(orderNumber)) {
        order = await Order.findOne({ orderNumber });
      }
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.type !== 'online') {
      return res.status(400).json({ message: 'Not an online order' });
    }

    order.status = 'preparing';
    await order.save();

    // Emit socket event
    const io = req.app.get('io');
    io.emit('order-updated', order);

    res.json(order);
  } catch (error) {
    console.error('Accept online order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get kitchen items
// @route   GET /api/orders/kitchen
// @access  Private
const getKitchenItems = async (req, res) => {
  try {
    const items = await KitchenItem.find({
      status: { $in: ['queued', 'cooking'] }
    })
      .populate('order')
      .sort({ createdAt: 1, priority: -1 });

    res.json(items);
  } catch (error) {
    console.error('Get kitchen items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update kitchen item status
// @route   PATCH /api/orders/kitchen/:id/status
// @access  Private
const updateKitchenItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate that id is a valid ObjectId
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid kitchen item ID' });
    }

    const item = await KitchenItem.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('order');

    if (!item) {
      return res.status(404).json({ message: 'Kitchen item not found' });
    }

    // Update order item status
    if (item.orderItemId) {
      await Order.updateOne(
        { _id: item.order._id, 'items._id': item.orderItemId },
        { $set: { 'items.$.kitchenStatus': status } }
      );
    }

    // Check if all items are ready, update order status
    if (status === 'ready') {
      const pendingItems = await KitchenItem.countDocuments({
        order: item.order._id,
        status: { $ne: 'ready' }
      });

      if (pendingItems === 0) {
        await Order.findByIdAndUpdate(item.order._id, { status: 'ready' });
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('kitchen-updated', { type: 'status-change', item });

    res.json(item);
  } catch (error) {
    console.error('Update kitchen item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Release table from order (without payment)
// @route   POST /api/orders/:id/release-table
// @access  Private
const releaseOrderTable = async (req, res) => {
  try {
    const { id } = req.params;

    let order;
    if (isValidObjectId(id)) {
      order = await Order.findById(id);
    } else {
      const orderNumber = parseInt(id, 10);
      if (!isNaN(orderNumber)) {
        order = await Order.findOne({ orderNumber });
      }
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.table) {
      return res.status(400).json({ message: 'This order has no table assigned' });
    }

    const table = await Table.findByIdAndUpdate(
      order.table,
      { status: 'available', currentOrderId: null },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Emit socket events
    const io = req.app.get('io');
    io.emit('table-updated', table);

    res.json({ message: 'Table released successfully', table });
  } catch (error) {
    console.error('Release order table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
