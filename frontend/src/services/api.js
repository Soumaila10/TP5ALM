const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3000/api/v1`;
  }
  return 'http://localhost:3000/api/v1';
};

const API_URL = getApiUrl();

let accessToken = '';

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

async function refreshToken() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // credentials: 'include' is critical to send and receive httpOnly cookies
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch (err) {
    setAccessToken('');
    throw err;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Set credentials include by default to send cookies
  options.credentials = options.credentials || 'include';
  options.headers = options.headers || {};
  
  if (accessToken) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    if (typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  let response = await fetch(url, options);

  // If unauthorized due to access token expiry, try to refresh once
  if (response.status === 401) {
    try {
      const newParsedToken = await refreshToken();
      options.headers['Authorization'] = `Bearer ${newParsedToken}`;
      response = await fetch(url, options);
    } catch (refreshErr) {
      // Refresh failed, clear token and bubble up error
      setAccessToken('');
      // Trigger a custom event for the store to know user was logged out
      window.dispatchEvent(new Event('auth-logout'));
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error?.message || 'Une erreur est survenue');
    error.status = response.status;
    error.code = errorData.error?.code;
    throw error;
  }

  return response.json();
}
