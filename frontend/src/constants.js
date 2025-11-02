// Shared constants across the application

// API Configuration
export const API_DEFAULT_BASE_URL = '/api';
export const API_VERSION = '/v1';

// UI Colors
export const COLORS = {
  // Google OAuth button colors
  GOOGLE_BUTTON_BG: '#424242',
  GOOGLE_BUTTON_BG_HOVER: '#353535',
  GOOGLE_BUTTON_BORDER: '#e0e0e0',
  GOOGLE_BUTTON_TEXT: '#ffffff',

  // Diff highlighting
  DIFF_HL_LEFT: 'rgba(255, 59, 48, 0.12)',
  DIFF_HL_RIGHT: 'rgba(46, 160, 67, 0.12)',
};

// Code display constants
export const CODE_DISPLAY = {
  MAX_CODE_HEIGHT: 240,
  FONT_FAMILY: 'var(--mantine-font-family-monospace)',
  FONT_SIZE: 'var(--mantine-font-size-sm)',
  BORDER_RADIUS: 8,
  PADDING: 8,
  BACKGROUND: 'var(--mantine-color-gray-0)',
  BORDER: '1px solid var(--mantine-color-default-border)',
};

// OAuth Configuration
export const OAUTH_CONFIG = {
  GOOGLE_SCOPES: 'openid email profile',
  PKCE_CODE_CHALLENGE_METHOD: 'S256',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  GOOGLE_CODE_VERIFIER: 'google_code_verifier',
  GOOGLE_STATE: 'google_state',
  GOOGLE_NONCE: 'google_nonce',
};
