import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { parseClockTime } from './time';

const ALERT_CHANNEL_ID = 'planner-alerts';
const REMINDER_NOTIFICATION_TYPE = 'reminder-alarm';

let permissionPromise;
let pushTokenPromise;

function isSupportedPlatform() {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

if (isSupportedPlatform()) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureNotificationPermission() {
  if (!isSupportedPlatform()) {
    return false;
  }

  if (!permissionPromise) {
    permissionPromise = (async () => {
      try {
        let permissionStatus = (await Notifications.getPermissionsAsync()).status;

        if (permissionStatus !== 'granted') {
          permissionStatus = (
            await Notifications.requestPermissionsAsync({
              ios: {
                allowAlert: true,
                allowBadge: false,
                allowSound: true,
              },
            })
          ).status;
        }

        if (permissionStatus === 'granted' && Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
            name: 'Planner Alerts',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            enableVibrate: true,
            vibrationPattern: [0, 300, 200, 300],
          });
        }

        return permissionStatus === 'granted';
      } catch (error) {
        return false;
      }
    })();
  }

  return permissionPromise;
}

function buildReminderTriggerDate(dateText, timeText) {
  if (!dateText) {
    return null;
  }

  const parsedTime = parseClockTime(timeText);
  if (!parsedTime) {
    return null;
  }

  const [year, month, day] = String(dateText)
    .split('-')
    .map((value) => Number(value));

  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return null;
  }

  const triggerDate = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0, 0);
  if (Number.isNaN(triggerDate.getTime())) {
    return null;
  }

  return triggerDate;
}

function buildReminderBody(reminder) {
  const creatorSuffix = reminder.createdByName ? ` Added by ${reminder.createdByName}.` : '';
  return `${reminder.title} is due now.${creatorSuffix}`;
}

function isReminderAlarmRequest(request) {
  return request?.content?.data?.notificationType === REMINDER_NOTIFICATION_TYPE;
}

function getImmediateTrigger() {
  if (Platform.OS === 'android') {
    return { channelId: ALERT_CHANNEL_ID };
  }

  return null;
}

export async function initializeNotifications() {
  return ensureNotificationPermission();
}

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    null
  );
}

export async function getRemotePushToken() {
  if (!isSupportedPlatform() || !Device.isDevice) {
    return null;
  }

  const isGranted = await ensureNotificationPermission();
  if (!isGranted) {
    return null;
  }

  if (!pushTokenPromise) {
    pushTokenPromise = (async () => {
      const projectId = getProjectId();
      if (!projectId) {
        return null;
      }

      try {
        const response = await Notifications.getExpoPushTokenAsync({ projectId });
        return response?.data || null;
      } catch (error) {
        pushTokenPromise = null;
        return null;
      }
    })();
  }

  return pushTokenPromise;
}

export async function showImmediateNotification({ title, body, data = {} }) {
  const isGranted = await ensureNotificationPermission();
  if (!isGranted) {
    return null;
  }

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        vibrate: [0, 300, 200, 300],
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: getImmediateTrigger(),
    });
  } catch (error) {
    return null;
  }
}

export async function clearReminderNotifications() {
  if (!isSupportedPlatform()) {
    return;
  }

  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduledNotifications
        .filter(isReminderAlarmRequest)
        .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
    );
  } catch (error) {
    // Ignore cleanup failures on unsupported devices/environments.
  }
}

export async function syncReminderNotifications(reminders = []) {
  const isGranted = await ensureNotificationPermission();
  if (!isGranted) {
    return;
  }

  await clearReminderNotifications();

  const remindersToSchedule = reminders
    .map((reminder) => ({
      ...reminder,
      triggerDate: buildReminderTriggerDate(reminder.date, reminder.time),
    }))
    .filter((reminder) => Boolean(reminder.triggerDate) && !reminder.done && reminder.triggerDate.getTime() > Date.now());

  await Promise.all(
    remindersToSchedule.map((reminder) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder Alert',
          body: buildReminderBody(reminder),
          data: {
            notificationType: REMINDER_NOTIFICATION_TYPE,
            reminderId: reminder._id,
          },
          sound: 'default',
          vibrate: [0, 500, 250, 500],
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.triggerDate,
          ...(Platform.OS === 'android' ? { channelId: ALERT_CHANNEL_ID } : {}),
        },
      }).catch(() => null)
    )
  );
}
