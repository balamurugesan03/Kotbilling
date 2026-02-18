const Table = require('../models/Table');
const Order = require('../models/Order');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
const getAllTables = async (req, res) => {
  try {
    const { status, section } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (section) filter.section = section;

    const tables = await Table.find(filter)
      .populate('currentOrderId')
      .sort({ section: 1, number: 1 });

    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Private
const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('currentOrderId');

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    console.error('Get table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get table stats
// @route   GET /api/tables/stats
// @access  Private
const getTableStats = async (req, res) => {
  try {
    const tables = await Table.find();

    const stats = {
      total: tables.length,
      available: tables.filter(t => t.status === 'available').length,
      occupied: tables.filter(t => t.status === 'occupied').length,
      reserved: tables.filter(t => t.status === 'reserved').length,
      bySection: {}
    };

    // Group by section
    tables.forEach(table => {
      if (!stats.bySection[table.section]) {
        stats.bySection[table.section] = { total: 0, available: 0, occupied: 0, reserved: 0 };
      }
      stats.bySection[table.section].total++;
      stats.bySection[table.section][table.status]++;
    });

    res.json(stats);
  } catch (error) {
    console.error('Get table stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create table
// @route   POST /api/tables
// @access  Private/Admin
const createTable = async (req, res) => {
  try {
    const { number, capacity, section } = req.body;

    const existingTable = await Table.findOne({ number });
    if (existingTable) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    const table = await Table.create({ number, capacity, section });

    res.status(201).json(table);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private
const updateTable = async (req, res) => {
  try {
    const { capacity, section, status, reservationName, reservationTime } = req.body;

    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (capacity) table.capacity = capacity;
    if (section) table.section = section;
    if (status) table.status = status;
    if (reservationName !== undefined) table.reservationName = reservationName;
    if (reservationTime !== undefined) table.reservationTime = reservationTime;

    await table.save();

    // Emit socket event
    const io = req.app.get('io');
    io.emit('table-updated', table);

    res.json(table);
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update table status
// @route   PATCH /api/tables/:id/status
// @access  Private
const updateTableStatus = async (req, res) => {
  try {
    const { status, orderId, reservationName, reservationTime } = req.body;

    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    table.status = status;

    if (status === 'occupied' && orderId) {
      table.currentOrderId = orderId;
    }

    if (status === 'reserved') {
      table.reservationName = reservationName;
      table.reservationTime = reservationTime;
    }

    if (status === 'available') {
      table.currentOrderId = null;
      table.reservationName = null;
      table.reservationTime = null;
    }

    await table.save();

    // Emit socket event
    const io = req.app.get('io');
    io.emit('table-updated', table);

    res.json(table);
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reserve table
// @route   POST /api/tables/:id/reserve
// @access  Private
const reserveTable = async (req, res) => {
  try {
    const { reservationName, reservationTime } = req.body;

    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.status !== 'available') {
      return res.status(400).json({ message: 'Table is not available for reservation' });
    }

    table.status = 'reserved';
    table.reservationName = reservationName;
    table.reservationTime = reservationTime;

    await table.save();

    // Emit socket event
    const io = req.app.get('io');
    io.emit('table-updated', table);

    res.json(table);
  } catch (error) {
    console.error('Reserve table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Release table
// @route   POST /api/tables/:id/release
// @access  Private
const releaseTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    table.status = 'available';
    table.currentOrderId = null;
    table.reservationName = null;
    table.reservationTime = null;

    await table.save();

    // Emit socket event
    const io = req.app.get('io');
    io.emit('table-updated', table);

    res.json(table);
  } catch (error) {
    console.error('Release table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.status === 'occupied') {
      return res.status(400).json({ message: 'Cannot delete an occupied table' });
    }

    await table.deleteOne();

    res.json({ message: 'Table deleted' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllTables,
  getTableById,
  getTableStats,
  createTable,
  updateTable,
  updateTableStatus,
  reserveTable,
  releaseTable,
  deleteTable
};
