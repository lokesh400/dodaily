import { apiRequest } from './client';

export function listTasks() {
  return apiRequest('/api/tasks');
}

export function createTask(payload) {
  return apiRequest('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTask(taskId, payload) {
  return apiRequest(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteTask(taskId) {
  return apiRequest(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });
}
