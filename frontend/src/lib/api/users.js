import api from '../apiClient';

export async function getMyStats() {
  const { data } = await api.get('/users/me/stats');
  return data;
}

export async function getMyRecentSubmissions() {
  const { data } = await api.get('/users/me/recent-submissions');
  return data;
}

