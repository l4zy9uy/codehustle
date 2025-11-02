// Environment configuration and utilities

// Environment variables with defaults
export const ENV = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  API_HOST: import.meta.env.VITE_API_HOST || window.location.origin,

  // OAuth Configuration
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,

  // Feature Flags
  ENABLE_API_MOCKS: import.meta.env.VITE_ENABLE_API_MOCKS === 'true',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

// Environment validation
export const validateEnv = () => {
  const requiredVars = ['GOOGLE_CLIENT_ID'];

  for (const varName of requiredVars) {
    if (!ENV[varName]) {
      console.warn(`Warning: ${varName} is not set in environment variables`);
    }
  }
};

// Utility functions
export const getApiUrl = (path = '') => {
  const baseUrl = ENV.API_BASE_URL;

  // If baseUrl is a full URL (starts with http), use it directly
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return `${baseUrl}${path}`;
  }

  // Otherwise, construct URL with API_HOST
  return `${ENV.API_HOST}${baseUrl}${path}`;
};

export const getOAuthRedirectUri = () => {
  const baseUrl = ENV.API_BASE_URL;

  // If baseUrl is a full URL, use it directly for OAuth
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return `${baseUrl}/auth/google/callback`;
  }

  // Otherwise, construct with API_HOST
  return `${ENV.API_HOST}${baseUrl}/auth/google/callback`;
};

// Initialize environment validation
validateEnv();
