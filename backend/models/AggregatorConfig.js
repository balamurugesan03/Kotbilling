const mongoose = require('mongoose');

const menuOverrideSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  platformPrice: {
    type: Number,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const aggregatorConfigSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['swiggy', 'zomato'],
    required: true,
    unique: true
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  apiKey: {
    type: String,
    default: ''
  },
  apiSecret: {
    type: String,
    default: ''
  },
  storeId: {
    type: String,
    default: ''
  },
  webhookSecret: {
    type: String,
    default: ''
  },
  autoAccept: {
    type: Boolean,
    default: false
  },
  defaultPrepTime: {
    type: Number,
    default: 20
  },
  menuOverrides: [menuOverrideSchema],
  connectionStatus: {
    type: String,
    enum: ['disconnected', 'connected', 'error'],
    default: 'disconnected'
  },
  lastSyncAt: {
    type: Date,
    default: null
  },
  platformBaseUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AggregatorConfig', aggregatorConfigSchema);
