const MenuItem = require('../models/MenuItem');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Private
const getAllMenuItems = async (req, res) => {
  try {
    const { category, available, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (available !== undefined) filter.available = available === 'true';
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });

    res.json(items);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get menu item by ID
// @route   GET /api/menu/:id
// @access  Private
const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get menu items by category
// @route   GET /api/menu/category/:category
// @access  Private
const getMenuItemsByCategory = async (req, res) => {
  try {
    const items = await MenuItem.find({
      category: req.params.category,
      available: true
    }).sort({ name: 1 });

    res.json(items);
  } catch (error) {
    console.error('Get menu by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private/Admin
const createMenuItem = async (req, res) => {
  try {
    const { name, category, price, isVeg, description, preparationTime } = req.body;

    const item = await MenuItem.create({
      name,
      category,
      price,
      isVeg,
      description,
      preparationTime
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private/Admin
const updateMenuItem = async (req, res) => {
  try {
    const { name, category, price, isVeg, available, description, preparationTime } = req.body;

    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (name) item.name = name;
    if (category) item.category = category;
    if (price !== undefined) item.price = price;
    if (isVeg !== undefined) item.isVeg = isVeg;
    if (available !== undefined) item.available = available;
    if (description !== undefined) item.description = description;
    if (preparationTime !== undefined) item.preparationTime = preparationTime;

    await item.save();

    res.json(item);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle menu item availability
// @route   PATCH /api/menu/:id/availability
// @access  Private/Admin
const toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    item.available = !item.available;
    await item.save();

    res.json(item);
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private/Admin
const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await item.deleteOne();

    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get menu categories
// @route   GET /api/menu/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  getMenuItemsByCategory,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
  getCategories
};
