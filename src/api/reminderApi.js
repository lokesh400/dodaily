import { apiRequest } from './client';

export function listReminders() {
  return apiRequest('/api/reminders');
}

export function createReminder(payload) {
  return apiRequest('/api/reminders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateReminder(reminderId, payload) {
  return apiRequest(`/api/reminders/${reminderId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteReminder(reminderId) {
  return apiRequest(`/api/reminders/${reminderId}`, {
    method: 'DELETE',
  });
}
