const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: [true, 'Table number is required'],
    unique: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1,
    max: 20
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  reservationName: {
    type: String,
    default: null
  },
  reservationTime: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', tableSchema);
