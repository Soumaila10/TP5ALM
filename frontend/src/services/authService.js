import { apiRequest, setAccessToken } from './api';

export async function register({ email, password, firstName, lastName, phone }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: { email, password, firstName, lastName, phone },
  });
}

export async function login({ email, password }) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  
  if (result.accessToken) {
    setAccessToken(result.accessToken);
  }
  
  return result;
}

export async function verifyOTP({ tempToken, code }) {
  const result = await apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: { tempToken, code },
  });
  
  if (result.accessToken) {
    setAccessToken(result.accessToken);
  }
  
  return result;
}

export async function logout() {
  await apiRequest('/auth/logout', {
    method: 'POST',
  });
  setAccessToken('');
}

export function getGoogleAuthUrl() {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  return `${baseUrl}/auth/google`;
}

export function getGithubAuthUrl() {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  return `${baseUrl}/auth/github`;
}
