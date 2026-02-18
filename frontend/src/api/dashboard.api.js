import api from './axios';

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getRunningOrders = async () => {
  const response = await api.get('/dashboard/running-orders');
  return response.data;
};

export const getOnlineOrders = async () => {
  const response = await api.get('/dashboard/online-orders');
  return response.data;
};

export const getLowStockAlerts = async () => {
  const response = await api.get('/dashboard/low-stock');
  return response.data;
};

export const getDashboardData = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

// Sales Report APIs
export const getDailySalesReport = async (date) => {
  const params = date ? { date } : {};
  const response = await api.get('/dashboard/sales/daily', { params });
  return response.data;
};

export const getWeeklySalesReport = async (date) => {
  const params = date ? { date } : {};
  const response = await api.get('/dashboard/sales/weekly', { params });
  return response.data;
};

export const getMonthlySalesReport = async (date) => {
  const params = {};
  if (date) {
    const d = new Date(date);
    params.month = d.getMonth() + 1;
    params.year = d.getFullYear();
  }
  const response = await api.get('/dashboard/sales/monthly', { params });
  return response.data;
};
