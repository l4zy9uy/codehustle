import api from '../apiClient';

export async function listSubmissions(params) {
  const { data } = await api.get('/submissions', { params });
  return data; // { submissions: [...], total: number, page: number, page_size: number }
}

export async function getSubmission(id) {
  const { data } = await api.get(`/submissions/${id}`);
  return data; // submission object
}

export async function createSubmission(payload) {
  const { data } = await api.post('/submissions', payload);
  return data; // created submission
}

