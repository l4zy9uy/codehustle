import api from '../apiClient';

export async function getAnnouncements(params) {
  const { data } = await api.get('/announcements', { params });
  return data; // { items: [...] }
}

export async function getAnnouncement(id) {
  const { data } = await api.get(`/announcements/${id}`);
  return data; // announcement object
}

export async function createAnnouncement(payload) {
  const { data } = await api.post('/announcements', payload);
  return data;
}

export async function updateAnnouncement(id, payload) {
  const { data } = await api.put(`/announcements/${id}`, payload);
  return data;
}

export async function deleteAnnouncement(id) {
  await api.delete(`/announcements/${id}`);
  return true;
}
