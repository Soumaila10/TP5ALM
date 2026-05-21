import { apiRequest } from './api';

export async function getMatches(filters = {}) {
  const queryParams = new URLSearchParams();
  if (filters.teamA) queryParams.append('teamA', filters.teamA);
  if (filters.teamB) queryParams.append('teamB', filters.teamB);
  if (filters.stadiumId) queryParams.append('stadiumId', filters.stadiumId);
  if (filters.date) queryParams.append('date', filters.date);

  const queryString = queryParams.toString();
  const endpoint = `/matches${queryString ? `?${queryString}` : ''}`;
  return apiRequest(endpoint);
}

export async function getMatchById(id) {
  return apiRequest(`/matches/${id}`);
}

export async function getMatchSeats(id) {
  return apiRequest(`/matches/${id}/seats`);
}
