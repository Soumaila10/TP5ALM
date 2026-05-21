import { apiRequest } from './api';

export async function getOrders() {
  return apiRequest('/orders');
}

export async function getOrderDetails(orderId) {
  return apiRequest(`/orders/${orderId}`);
}
