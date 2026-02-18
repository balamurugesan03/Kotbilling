import api from './axios';

export const getAllTables = async (params = {}) => {
  const response = await api.get('/tables', { params });
  return response.data;
};

export const getTableByIdApi = async (id) => {
  const response = await api.get(`/tables/${id}`);
  return response.data;
};

export const getTableStatsApi = async () => {
  const response = await api.get('/tables/stats');
  return response.data;
};

export const updateTableStatus = async (id, status, additionalData = {}) => {
  const response = await api.patch(`/tables/${id}/status`, { status, ...additionalData });
  return response.data;
};

export const reserveTable = async (id, reservationName, reservationTime) => {
  const response = await api.post(`/tables/${id}/reserve`, { reservationName, reservationTime });
  return response.data;
};

export const occupyTable = async (id, orderId) => {
  const response = await api.patch(`/tables/${id}/status`, {
    status: 'occupied',
    orderId
  });
  return response.data;
};

export const releaseTable = async (id) => {
  const response = await api.post(`/tables/${id}/release`);
  return response.data;
};

export const createTable = async (tableData) => {
  const response = await api.post('/tables', tableData);
  return response.data;
};

export const updateTable = async (id, tableData) => {
  const response = await api.put(`/tables/${id}`, tableData);
  return response.data;
};

export const deleteTable = async (id) => {
  const response = await api.delete(`/tables/${id}`);
  return response.data;
};
