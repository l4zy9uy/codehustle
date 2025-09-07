import api from '../apiClient';

export async function getCourses(params) {
  const { data } = await api.get('/courses', { params });
  return data; // { items: [...] }
}

export async function getCourse(id) {
  const { data } = await api.get(`/courses/${id}`);
  return data; // { id, title, ... }
}

export async function getCourseProblems(id, params) {
  const { data } = await api.get(`/courses/${id}/problems`, { params });
  return data; // { items: [...] }
}

