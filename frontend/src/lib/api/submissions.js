import api from '../apiClient';

export async function listSubmissions(params) {
  const { data } = await api.get('/submissions', { params });
  return data; // { items: [...] }
}

export async function getSubmission(id) {
  const { data } = await api.get(`/submissions/${id}`);
  return data; // submission object
}

export async function createSubmission(payload) {
  const { data } = await api.post('/submissions', payload);
  return data; // created submission
}

