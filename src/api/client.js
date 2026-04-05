const API_BASE_URL = "https://dodaily.onrender.com"

// const API_BASE_URL = "http://10.200.64.198:4000";

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
    throw createApiError('No internet connection. You can browse cached data, but syncing changes requires going online.', {
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
