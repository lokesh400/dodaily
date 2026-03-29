import { apiRequest } from './client';

export function listIncomingAssignments(status = 'pending') {
  return apiRequest(`/api/friend-assignments/incoming?status=${encodeURIComponent(status)}`);
}

export function listOutgoingAssignments(status = 'all') {
  return apiRequest(`/api/friend-assignments/outgoing?status=${encodeURIComponent(status)}`);
}

export function sendTaskToFriend(payload) {
  return apiRequest('/api/friend-assignments/task', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function sendReminderToFriend(payload) {
  return apiRequest('/api/friend-assignments/reminder', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function respondAssignment(assignmentId, action) {
  return apiRequest(`/api/friend-assignments/${assignmentId}/respond`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}
