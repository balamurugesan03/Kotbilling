// User Roles
export const ROLES = {
  ADMIN: 'admin',
  WAITER: 'waiter',
};

// Order Statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Order Types
export const ORDER_TYPE = {
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  ONLINE: 'online',
};

// Table Statuses
export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
};

// Online Platforms
export const PLATFORMS = {
  SWIGGY: 'swiggy',
  ZOMATO: 'zomato',
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  ONLINE: 'online',
};

// Menu Categories
export const MENU_CATEGORIES = {
  STARTERS: 'starters',
  MAIN_COURSE: 'main_course',
  BREADS: 'breads',
  RICE: 'rice',
  BEVERAGES: 'beverages',
  DESSERTS: 'desserts',
};

// Status color mappings for badges
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'orange',
  [ORDER_STATUS.PREPARING]: 'blue',
  [ORDER_STATUS.READY]: 'green',
  [ORDER_STATUS.SERVED]: 'violet',
  [ORDER_STATUS.COMPLETED]: 'gray',
  [ORDER_STATUS.CANCELLED]: 'red',
};

export const TABLE_STATUS_COLORS = {
  [TABLE_STATUS.AVAILABLE]: 'green',
  [TABLE_STATUS.OCCUPIED]: 'orange',
  [TABLE_STATUS.RESERVED]: 'blue',
};

export const PLATFORM_COLORS = {
  [PLATFORMS.SWIGGY]: 'orange',
  [PLATFORMS.ZOMATO]: 'red',
};

// Time thresholds for order highlighting (in minutes)
export const ORDER_TIME_THRESHOLDS = {
  WARNING: 15, // Yellow highlight
  DANGER: 25, // Red highlight
};

// Aggregator connection statuses
export const AGGREGATOR_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
  ERROR: 'error',
};

export const AGGREGATOR_STATUS_COLORS = {
  [AGGREGATOR_STATUS.DISCONNECTED]: 'gray',
  [AGGREGATOR_STATUS.CONNECTED]: 'green',
  [AGGREGATOR_STATUS.ERROR]: 'red',
};

// Webhook base URL (used for display in config UI)
export const WEBHOOK_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
