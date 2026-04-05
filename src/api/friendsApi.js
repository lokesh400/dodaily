import { apiRequest } from './client';

export function listFriends() {
  return apiRequest('/api/friends');
}

export function sendFriendRequest(payload) {
  return apiRequest('/api/friends/request?notifyEmail=false', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listFriendRequests(status = 'pending') {
  return apiRequest(`/api/friends/requests?status=${encodeURIComponent(status)}`);
}

export function getFriendBadges() {
  return apiRequest('/api/friends/badges');
}

export function respondFriendRequest(requestId, action) {
  return apiRequest(`/api/friends/requests/${requestId}/respond?notifyEmail=false`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}
