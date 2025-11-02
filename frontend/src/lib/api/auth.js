import api from '../apiClient';

export async function login(credentials) {
  const { data } = await api.post('/login', credentials);
  return data; // { token, ... }
}

export async function forgotPassword(email) {
  const { data } = await api.post('/forgot-password', { email });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/me');
  return data; // { user }
}

