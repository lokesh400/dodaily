import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_CACHE_KEY = '@dodaily/reminders/v1';
const SESSION_SNAPSHOT_KEY = '@dodaily/session-snapshot/v1';

function sanitizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeObject(value) {
  return value && typeof value === 'object' ? value : null;
}

function safeJsonParse(rawValue) {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return null;
  }
}

export async function saveReminderCache(reminders = [], updatedAt = new Date().toISOString()) {
  const payload = {
    reminders: sanitizeArray(reminders),
    updatedAt,
  };

  await AsyncStorage.setItem(REMINDER_CACHE_KEY, JSON.stringify(payload));
}

export async function loadReminderCache() {
  const payload = safeJsonParse(await AsyncStorage.getItem(REMINDER_CACHE_KEY));
  if (!payload) {
    return {
      reminders: [],
      updatedAt: null,
    };
  }

  return {
    reminders: sanitizeArray(payload.reminders),
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : null,
  };
}

export async function clearReminderCache() {
  await AsyncStorage.removeItem(REMINDER_CACHE_KEY);
}

export async function saveSessionSnapshot(snapshot) {
  const payload = sanitizeObject(snapshot);
  if (!payload) {
    return;
  }

  await AsyncStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(payload));
}

export async function loadSessionSnapshot() {
  const payload = safeJsonParse(await AsyncStorage.getItem(SESSION_SNAPSHOT_KEY));
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    user: sanitizeObject(payload.user),
    tasks: sanitizeArray(payload.tasks),
    reminders: sanitizeArray(payload.reminders),
    friends: sanitizeArray(payload.friends),
    incomingFriendRequests: sanitizeArray(payload.incomingFriendRequests),
    outgoingFriendRequests: sanitizeArray(payload.outgoingFriendRequests),
    incomingAssignments: sanitizeArray(payload.incomingAssignments),
    outgoingAssignments: sanitizeArray(payload.outgoingAssignments),
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : null,
  };
}

export async function clearSessionSnapshot() {
  await AsyncStorage.removeItem(SESSION_SNAPSHOT_KEY);
}
