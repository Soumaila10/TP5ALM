import { apiRequest, getAccessToken } from './api';

export async function getAdminMatches() {
  return apiRequest('/admin/matches');
}

export async function createAdminMatch(matchData) {
  return apiRequest('/admin/matches', {
    method: 'POST',
    body: matchData,
  });
}

export async function updateAdminMatch(id, matchData) {
  return apiRequest(`/admin/matches/${id}`, {
    method: 'PUT',
    body: matchData,
  });
}

export async function deleteAdminMatch(id) {
  return apiRequest(`/admin/matches/${id}`, {
    method: 'DELETE',
  });
}

export async function getAdminStats() {
  return apiRequest('/admin/stats');
}

export async function downloadAdminCSV() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const url = `${API_URL}/admin/export`;
  const token = getAccessToken();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Impossible d’exporter les ventes');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', 'sales_export.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function getStadiums() {
  return apiRequest('/stadiums');
}
