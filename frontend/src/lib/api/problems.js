import api from '../apiClient';

export async function getProblems(params = {}) {
  // params: { q?, difficulty?, status?, tags?: string | string[], page?, page_size? }
  const { data } = await api.get('/problems', { params });
  return data; // { problems: [...], total: number, page: number, page_size: number }
}

export async function getProblem(slug) {
  const { data } = await api.get(`/problems/${slug}`);

  console.log('=== API RESPONSE ===');
  console.log('Full API response:', data);
  console.log('API body field (before processing):', data.body);
  console.log('Body length:', data.body?.length);
  console.log('Body preview (first 500 chars):', data.body?.substring(0, 500));

  // Remove all backticks (`) and tildes (~) from the body
  const cleanedBody = data.body ? data.body.replace(/[`~]/g, '') : '';
  
  console.log('API body field (after removing ` and ~):', cleanedBody);
  console.log('Cleaned body length:', cleanedBody.length);

  // Transform API response to match component expectations
  return {
    id: data.id,
    slug: data.code,
    title: data.name,
    difficulty: data.diff,
    time_limit: data.time_limit,
    memory_limit_mb: Math.round(data.memory_limit / (1024 * 1024)), // Convert bytes to MB
    tags: data.types || [],
    solved_by_me: false, // Default - you might need to implement this separately
    acceptance_rate: null, // Default - you might need to implement this separately
    statement: {
      overview: cleanedBody,
      input: '',
      output: '',
      constraints: [],
    },
    samples: [],
  };
}

export async function getTags() {
  const { data } = await api.get('/tags');
  return data; // { items: [...] }
}

