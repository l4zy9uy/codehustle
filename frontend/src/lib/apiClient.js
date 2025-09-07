import axios from 'axios';

// Base URL: env override or default to '/api'
const baseURL = import.meta?.env?.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header from localStorage if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore localStorage errors
  }
  return config;
});

// Normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract a reasonable message for callers
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Request failed';
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    normalized.data = error?.response?.data;
    return Promise.reject(normalized);
  }
);

export default api;

