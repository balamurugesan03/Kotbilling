import api from './axios';

// Orders
export const getAllOrders = async (params = {}) => {
  const response = await api.get('/orders', { params });
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};

export const addItemsToOrder = async (orderId, items) => {
  const response = await api.post(`/orders/${orderId}/items`, { items });
  return response.data;
};

export const processPayment = async (orderId, paymentMethod, discount = 0) => {
  const response = await api.post(`/orders/${orderId}/payment`, { paymentMethod, discount });
  return response.data;
};

// Online Orders
export const getAllOnlineOrders = async () => {
  const response = await api.get('/orders/online');
  return response.data;
};

export const updateOnlineOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};

export const acceptOnlineOrder = async (id) => {
  const response = await api.post(`/orders/${id}/accept`);
  return response.data;
};
