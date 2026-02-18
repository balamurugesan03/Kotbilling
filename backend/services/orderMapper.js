const MenuItem = require('../models/MenuItem');

/**
 * Map Swiggy order payload to internal Order schema
 * @param {Object} swiggyOrder - Raw Swiggy webhook payload
 * @returns {Object} Internal order data
 */
const mapSwiggyOrder = async (swiggyOrder) => {
  const items = await mapOrderItems(swiggyOrder.items || swiggyOrder.order_items || []);

  return {
    type: 'online',
    platform: 'swiggy',
    platformOrderId: String(swiggyOrder.order_id || swiggyOrder.id),
    status: 'pending',
    customerName: swiggyOrder.customer?.name || swiggyOrder.customer_name || 'Swiggy Customer',
    customerPhone: swiggyOrder.customer?.phone || swiggyOrder.customer_phone || '',
    deliveryAddress: formatAddress(swiggyOrder.delivery_address || swiggyOrder.address),
    items,
    subtotal: calculateSubtotal(items),
    paymentMethod: 'online',
    paymentStatus: 'paid'
  };
};

/**
 * Map Zomato order payload to internal Order schema
 * @param {Object} zomatoOrder - Raw Zomato webhook payload
 * @returns {Object} Internal order data
 */
const mapZomatoOrder = async (zomatoOrder) => {
  const items = await mapOrderItems(zomatoOrder.items || zomatoOrder.order_items || []);

  return {
    type: 'online',
    platform: 'zomato',
    platformOrderId: String(zomatoOrder.order_id || zomatoOrder.id),
    status: 'pending',
    customerName: zomatoOrder.customer?.name || zomatoOrder.customer_name || 'Zomato Customer',
    customerPhone: zomatoOrder.customer?.phone || zomatoOrder.customer_phone || '',
    deliveryAddress: formatAddress(zomatoOrder.delivery_address || zomatoOrder.address),
    items,
    subtotal: calculateSubtotal(items),
    paymentMethod: 'online',
    paymentStatus: 'paid'
  };
};

/**
 * Map platform order items to internal item schema
 * Attempts to match with existing MenuItem by name
 */
const mapOrderItems = async (platformItems) => {
  const items = [];

  for (const item of platformItems) {
    const name = item.name || item.item_name || 'Unknown Item';
    const quantity = item.quantity || item.qty || 1;
    const price = item.price || item.total_price || item.unit_price || 0;

    // Try to match with existing menu item
    const menuItem = await MenuItem.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') }
    });

    items.push({
      menuItem: menuItem?._id || null,
      name,
      quantity,
      price: price / quantity, // Ensure unit price
      notes: item.notes || item.special_instructions || ''
    });
  }

  return items;
};

/**
 * Format delivery address from various payload formats
 */
const formatAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  const parts = [
    address.line1 || address.address_line_1,
    address.line2 || address.address_line_2,
    address.landmark,
    address.area || address.locality,
    address.city,
    address.pincode || address.zip
  ].filter(Boolean);
  return parts.join(', ');
};

const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  mapSwiggyOrder,
  mapZomatoOrder
};
