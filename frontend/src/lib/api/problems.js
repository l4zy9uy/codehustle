import api from '../apiClient';

export async function getProblems(params) {
  // params: { q?, difficulty?, status?, tags?: string | string[] }
  const { data } = await api.get('/problems', { params });
  return data; // { items: [...] }
}

export async function getProblem(slug) {
  const { data } = await api.get(`/problems/${slug}`);
  return data; // problem detail
}

export async function getTags() {
  const { data } = await api.get('/tags');
  return data; // { items: [...] }
}

