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

export async function requestPasswordReset(identifier) {
  const normalizedIdentifier = String(identifier || '').trim();
  if (!normalizedIdentifier) {
    throw new Error('Username or email is required');
  }

  const candidates = [
    {
      path: '/api/auth/forgot-password',
      payload: { usernameOrEmail: normalizedIdentifier },
    },
    {
      path: '/api/auth/forgot-password',
      payload: normalizedIdentifier.includes('@')
        ? { email: normalizedIdentifier }
        : { username: normalizedIdentifier },
    },
    {
      path: '/api/auth/request-password-reset',
      payload: { usernameOrEmail: normalizedIdentifier },
    },
  ];

  let lastError = null;

  for (const candidate of candidates) {
    try {
      return await apiRequest(candidate.path, {
        method: 'POST',
        body: JSON.stringify(candidate.payload),
      });
    } catch (requestError) {
      lastError = requestError;
      if (requestError?.status !== 400 && requestError?.status !== 404) {
        throw requestError;
      }
    }
  }

  throw lastError || new Error('Unable to request password reset right now.');
}
