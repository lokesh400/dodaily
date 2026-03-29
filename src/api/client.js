import { Platform } from 'react-native';

const API_BASE_URL = "https://dodaily.onrender.com"

function createApiError(message, details = {}) {
  const error = new Error(message);
  Object.assign(error, details);
  return error;
}

export async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include',
      ...options,
    });
  } catch (error) {
    throw createApiError('Could not reach the server. Check that your phone and server are on the same network.', {
      status: 0,
      isNetworkError: true,
      cause: error,
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createApiError(data.message || 'Request failed', {
      status: response.status,
      data,
    });
  }

  return data;
}
