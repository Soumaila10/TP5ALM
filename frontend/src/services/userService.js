import { apiRequest } from './api';

export async function updateProfile({ firstName, lastName, phone }) {
  return apiRequest('/users/profile', {
    method: 'PUT',
    body: { firstName, lastName, phone },
  });
}

export async function getProfile() {
  return apiRequest('/users/profile', {
    method: 'GET',
  });
}
