import api from './axios';

export const getAllInventory = async (params = {}) => {
  const response = await api.get('/inventory', { params });
  return response.data;
};

export const getInventoryById = async (id) => {
  const response = await api.get(`/inventory/${id}`);
  return response.data;
};

export const getLowStockItems = async () => {
  const response = await api.get('/inventory/low-stock');
  return response.data;
};

export const getInventoryStats = async () => {
  const response = await api.get('/inventory/stats');
  return response.data;
};

export const createInventoryItem = async (itemData) => {
  const response = await api.post('/inventory', itemData);
  return response.data;
};

export const updateInventoryItem = async (id, itemData) => {
  const response = await api.put(`/inventory/${id}`, itemData);
  return response.data;
};

export const updateStock = async (id, quantity, operation = 'set') => {
  const response = await api.patch(`/inventory/${id}/stock`, { quantity, operation });
  return response.data;
};

export const deleteInventoryItem = async (id) => {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
};
