import { apiRequest } from './api';

export async function createCart(matchId, seatId) {
  return apiRequest('/cart', {
    method: 'POST',
    body: { matchId, seatId },
  });
}

export async function getCart(cartId) {
  return apiRequest(`/cart/${cartId}`);
}

export async function deleteCart(cartId) {
  return apiRequest(`/cart/${cartId}`, {
    method: 'DELETE',
  });
}
