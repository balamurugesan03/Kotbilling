const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  kitchenStatus: {
    type: String,
    enum: ['queued', 'cooking', 'ready', 'served'],
    default: 'queued'
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['dine_in', 'takeaway', 'online'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending'
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  tableNumber: {
    type: Number
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online', null],
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  waiterName: {
    type: String
  },
  customerName: {
    type: String
  },
  customerPhone: {
    type: String
  },
  // Online order specific fields
  platform: {
    type: String,
    enum: ['swiggy', 'zomato', null],
    default: null
  },
  platformOrderId: {
    type: String
  },
  deliveryAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Auto-increment order number (must be pre-validate so it runs before required validation)
orderSchema.pre('validate', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'orderNumber': -1 } });
    this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1001;
  }
  next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.tax = Math.round(this.subtotal * 0.05 * 100) / 100; // 5% GST
  this.total = this.subtotal + this.tax - this.discount;
  next();
});

module.exports = mongoose.model('Order', orderSchema);
