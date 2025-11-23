import api from '../apiClient';

export async function getAnnouncements(params) {
  const { data } = await api.get('/announcements', { params });
  return data; // { items, total, page, page_size }
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

export async function markAnnouncementRead(id, status = 'read') {
  const { data } = await api.post(`/announcements/${id}/read`, { status });
  return data; // { id, status }
}
