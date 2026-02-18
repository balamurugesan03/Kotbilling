const mongoose = require('mongoose');

const kitchenItemSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: Number,
    required: true
  },
  orderItemId: {
    type: mongoose.Schema.Types.ObjectId
  },
  tableNumber: {
    type: Number,
    default: null
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['queued', 'cooking', 'ready'],
    default: 'queued'
  },
  notes: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  platform: {
    type: String,
    enum: ['swiggy', 'zomato', null],
    default: null
  },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KitchenItem', kitchenItemSchema);
