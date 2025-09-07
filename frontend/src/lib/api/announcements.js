import api from '../apiClient';

export async function getAnnouncements(params) {
  const { data } = await api.get('/announcements', { params });
  return data; // { items: [...] }
}

export async function getAnnouncement(id) {
  const { data } = await api.get(`/announcements/${id}`);
  return data; // announcement object
}

