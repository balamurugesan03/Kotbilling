const Inventory = require('../models/Inventory');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
const getAllInventory = async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    let filter = {};

    if (category) filter.category = category;

    let items = await Inventory.find(filter).sort({ name: 1 });

    // Filter low stock items if requested
    if (lowStock === 'true') {
      items = items.filter(item => item.currentStock <= item.threshold);
    }

    res.json(items);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory item by ID
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private
const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$threshold'] }
    }).sort({ currentStock: 1 });

    res.json(items);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory stats
// @route   GET /api/inventory/stats
// @access  Private
const getInventoryStats = async (req, res) => {
  try {
    const items = await Inventory.find();

    const stats = {
      totalItems: items.length,
      lowStock: items.filter(i => i.currentStock <= i.threshold && i.currentStock > 0).length,
      outOfStock: items.filter(i => i.currentStock === 0).length,
      totalValue: items.reduce((sum, i) => sum + (i.currentStock * i.price), 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private/Admin
const createInventoryItem = async (req, res) => {
  try {
    const { name, currentStock, unit, threshold, price, category, supplier } = req.body;

    const existingItem = await Inventory.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingItem) {
      return res.status(400).json({ message: 'Inventory item with this name already exists' });
    }

    const item = await Inventory.create({
      name,
      currentStock,
      unit,
      threshold,
      price,
      category,
      supplier
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin
const updateInventoryItem = async (req, res) => {
  try {
    const { name, currentStock, unit, threshold, price, category, supplier } = req.body;

    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (name) item.name = name;
    if (currentStock !== undefined) item.currentStock = currentStock;
    if (unit) item.unit = unit;
    if (threshold !== undefined) item.threshold = threshold;
    if (price !== undefined) item.price = price;
    if (category) item.category = category;
    if (supplier !== undefined) item.supplier = supplier;

    await item.save();

    // Emit socket event if low stock
    if (item.currentStock <= item.threshold) {
      const io = req.app.get('io');
      io.emit('low-stock-alert', item);
    }

    res.json(item);
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update stock quantity
// @route   PATCH /api/inventory/:id/stock
// @access  Private/Admin
const updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (operation === 'add') {
      item.currentStock += quantity;
    } else if (operation === 'subtract') {
      if (item.currentStock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      item.currentStock -= quantity;
    } else {
      item.currentStock = quantity; // Direct set
    }

    await item.save();

    // Emit socket event if low stock
    if (item.currentStock <= item.threshold) {
      const io = req.app.get('io');
      io.emit('low-stock-alert', item);
    }

    res.json(item);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    await item.deleteOne();

    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllInventory,
  getInventoryById,
  getLowStockItems,
  getInventoryStats,
  createInventoryItem,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem
};
