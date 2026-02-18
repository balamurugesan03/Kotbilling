const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    unique: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'L', 'pcs', 'g', 'ml'],
    required: true
  },
  threshold: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['vegetables', 'meat', 'dairy', 'grains', 'spices', 'beverages', 'other'],
    default: 'other'
  },
  supplier: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Virtual for checking if item is low stock
inventorySchema.virtual('isLowStock').get(function() {
  return this.currentStock <= this.threshold;
});

// Virtual for checking if item is out of stock
inventorySchema.virtual('isOutOfStock').get(function() {
  return this.currentStock === 0;
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
