import { apiRequest } from './api';

export async function createPaymentIntent(cartId, mock = false) {
  return apiRequest('/payment/intent', {
    method: 'POST',
    body: { cartId, mock },
  });
}

export async function confirmPayment(cartId, paymentIntentId) {
  return apiRequest('/payment/confirm', {
    method: 'POST',
    body: { cartId, paymentIntentId },
  });
}
