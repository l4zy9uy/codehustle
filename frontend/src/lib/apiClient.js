import axios from 'axios';
import { getApiUrl } from '../env';
import { STORAGE_KEYS } from '../constants';

// Base URL: constructed full API URL
const baseURL = getApiUrl('');

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
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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

