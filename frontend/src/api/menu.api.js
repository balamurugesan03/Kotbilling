import api from './axios';

export const getAllMenuItems = async (params = {}) => {
  const response = await api.get('/menu', { params });
  return response.data;
};

export const getMenuItemById = async (id) => {
  const response = await api.get(`/menu/${id}`);
  return response.data;
};

export const getMenuItemsByCategory = async (category) => {
  const response = await api.get(`/menu/category/${category}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/menu/categories');
  return response.data;
};

export const createMenuItem = async (itemData) => {
  const response = await api.post('/menu', itemData);
  return response.data;
};

export const updateMenuItem = async (id, itemData) => {
  const response = await api.put(`/menu/${id}`, itemData);
  return response.data;
};

export const toggleAvailability = async (id) => {
  const response = await api.patch(`/menu/${id}/availability`);
  return response.data;
};

export const deleteMenuItem = async (id) => {
  const response = await api.delete(`/menu/${id}`);
  return response.data;
};

export const searchMenuItems = async (query) => {
  const response = await api.get('/menu', { params: { search: query } });
  return response.data;
};

export const getAvailableItems = async () => {
  const response = await api.get('/menu', { params: { available: true } });
  return response.data;
};
