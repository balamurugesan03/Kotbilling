import api from './axios';

// Config
export const getAllAggregatorConfigs = async () => {
  const { data } = await api.get('/aggregator/config');
  return data;
};

export const getAggregatorConfig = async (platform) => {
  const { data } = await api.get(`/aggregator/config/${platform}`);
  return data;
};

export const upsertAggregatorConfig = async (platform, configData) => {
  const { data } = await api.put(`/aggregator/config/${platform}`, configData);
  return data;
};

export const testAggregatorConnection = async (platform) => {
  const { data } = await api.post(`/aggregator/config/${platform}/test`);
  return data;
};

// Menu Sync
export const getMenuWithOverrides = async (platform) => {
  const { data } = await api.get(`/aggregator/menu/${platform}`);
  return data;
};

export const saveMenuOverrides = async (platform, overrides) => {
  const { data } = await api.put(`/aggregator/menu/${platform}/overrides`, { overrides });
  return data;
};

export const syncMenuToPlatform = async (platform) => {
  const { data } = await api.post(`/aggregator/menu/${platform}/sync`);
  return data;
};

// Analytics
export const getAggregatorAnalytics = async (params = {}) => {
  const { data } = await api.get('/aggregator/analytics', { params });
  return data;
};

// Status Notification
export const notifyPlatformStatus = async (orderId) => {
  const { data } = await api.post(`/aggregator/orders/${orderId}/notify`);
  return data;
};
