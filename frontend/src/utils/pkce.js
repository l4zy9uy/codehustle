// src/utils/pkce.js
// Generate a secure random string
function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate code verifier for PKCE
export function generateCodeVerifier() {
  return generateRandomString(32);
}

// Generate code challenge from verifier using SHA256
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate state for CSRF protection
export function generateState() {
  return generateRandomString(16);
}

// Generate nonce for replay protection
export function generateNonce() {
  return generateRandomString(16);
}

