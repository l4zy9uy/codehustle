import api from '../apiClient';

export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data;
}
