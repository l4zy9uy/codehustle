import api from '../apiClient';

export async function getContests(params) {
  const { data } = await api.get('/contests', { params });
  return data; // { contests: [...], total: number, page: number, page_size: number }
}

export async function getContest(id) {
  const { data } = await api.get(`/contests/${id}`);
  return data; // contest object
}

export async function getContestProblems(id) {
  const { data } = await api.get(`/contests/${id}/problems`);
  return data; // { problems: [...] }
}

export async function getContestSubmissions(id, params = {}) {
  const { data } = await api.get(`/contests/${id}/submissions`, { params });
  return data; // { submissions: [...], total: number }
}

export async function getContestRankings(id) {
  const { data } = await api.get(`/contests/${id}/rankings`);
  return data; // { rankings: [...] }
}

export async function getContestClarifications(id) {
  const { data } = await api.get(`/contests/${id}/clarifications`);
  return data; // { clarifications: [...] }
}

export async function joinContest(id, isVirtual = false) {
  const { data } = await api.post(`/contests/${id}/join`, { virtual: isVirtual });
  return data;
}

export async function createContest(payload) {
  const { data } = await api.post('/contests', payload);
  return data;
}

