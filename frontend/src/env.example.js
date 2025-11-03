/**
 * Environment Configuration Example
 *
 * Copy this file to create a .env file in the root directory
 * and update the values according to your setup.
 */

// Example .env file content:
/*
# API Configuration
# Backend API base URL - can be a full URL or just a path
VITE_API_BASE_URL=/api

# Backend API host - should point to your backend server
# In development, this is typically http://localhost:3000
VITE_API_HOST=http://localhost:3000

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Feature Flags
VITE_ENABLE_API_MOCKS=false
*/

export const ENV_EXAMPLE = {
  // API Configuration
  'VITE_API_BASE_URL': '/api', // or full URL like 'http://localhost:3000/api'
  'VITE_API_HOST': 'http://localhost:3000', // Backend server URL

  // OAuth Configuration
  'VITE_GOOGLE_CLIENT_ID': 'your_google_client_id_here',

  // Feature Flags
  'VITE_ENABLE_API_MOCKS': 'false'
};
