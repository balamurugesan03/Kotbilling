import api from './axios';

export const loginApi = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const logoutApi = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getCurrentUserApi = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const changePasswordApi = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/password', { currentPassword, newPassword });
  return response.data;
};
