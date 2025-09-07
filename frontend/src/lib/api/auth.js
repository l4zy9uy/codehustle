import api from '../apiClient';

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data; // { token, ... }
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data; // { user }
}

