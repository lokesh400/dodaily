
import { apiRequest } from './client';

export function sendVerificationEmail() {
  return apiRequest('/api/auth/send-verification', {
    method: 'POST',
  });
}

export function register(payload) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(payload) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiRequest('/api/auth/logout', {
    method: 'POST',
  });
}

export function me() {
  return apiRequest('/api/auth/me');
}

export function updateMe(payload) {
  return apiRequest('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function registerPushToken(pushToken) {
  return apiRequest('/api/auth/push-token', {
    method: 'POST',
    body: JSON.stringify({ pushToken }),
  });
}

export function unregisterPushToken(pushToken) {
  return apiRequest('/api/auth/push-token', {
    method: 'DELETE',
    body: JSON.stringify({ pushToken }),
  });
}
