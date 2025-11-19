import api from '../apiClient';
import axios from 'axios';
import { getApiUrl } from '../../env';
import { STORAGE_KEYS, API_VERSION } from '../../constants';

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

export async function submitProblem(problemId, payload) {
  // payload: { lang: string, source: string }
  // lang format: 'cpp17', 'java17', 'py310'
  
  // Map language codes to API format
  const languageMap = {
    'cpp17': 'cpp',
    'java17': 'java',
    'py310': 'python',
  };
  
  // Map language versions (optional, defaults to 'latest' on backend)
  const languageVersionMap = {
    'cpp17': '10.2.0',
    'java17': '17',
    'py310': '3.12',
  };
  
  const language = languageMap[payload.lang] || payload.lang;
  const languageVersion = languageVersionMap[payload.lang] || 'latest';
  
  // Create a Blob from the source code string
  const codeBlob = new Blob([payload.source], { type: 'text/plain' });
  
  // Get file extension based on language
  const fileExtensionMap = {
    'cpp': 'cpp',
    'java': 'java',
    'python': 'py',
  };
  const extension = fileExtensionMap[language] || 'txt';
  
  // Create a File from the Blob
  const codeFile = new File([codeBlob], `solution.${extension}`, { type: 'text/plain' });
  
  // Create FormData
  const formData = new FormData();
  formData.append('code_file', codeFile);
  formData.append('language', language);
  formData.append('language_version', languageVersion);
  
  // Make the request with FormData
  // Use axios directly to avoid Content-Type conflicts with apiClient defaults
  const baseURL = `${getApiUrl('')}${API_VERSION}`;
  
  // Get auth token
  let authToken = null;
  try {
    authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    // ignore localStorage errors
  }
  
  const headers = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  // Don't set Content-Type - axios will set it automatically with boundary for FormData
  const { data } = await axios.post(`${baseURL}/problems/${problemId}/submit`, formData, {
    headers,
  });
  
  return data; // submission object
}

