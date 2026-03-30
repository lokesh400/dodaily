import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  login,
  logout,
  me,
  register,
  registerPushToken,
  unregisterPushToken,
  updateMe,
} from './src/api/authApi';
import BottomNav from './src/components/BottomNav';
import DateBar from './src/components/DateBar';
import ActionStatusModal from './src/components/ActionStatusModal';
import HapticTouchable from './src/components/HapticTouchable';
import {
  listFriendRequests,
  listFriends,
  respondFriendRequest,
  sendFriendRequest,
} from './src/api/friendsApi';
import {
  listIncomingAssignments,
  listOutgoingAssignments,
  respondAssignment,
  sendReminderToFriend,
  sendTaskToFriend,
} from './src/api/friendAssignmentsApi';
import { createReminder, deleteReminder, listReminders, updateReminder } from './src/api/reminderApi';
import { createTask, deleteTask as deleteTaskById, listTasks, updateTask } from './src/api/taskApi';
import FriendsTabScreen from './src/screens/FriendsTabScreen';
import LoginScreen from './src/screens/LoginScreen';
import PlannerTabScreen from './src/screens/PlannerTabScreen';
import RemindersTabScreen from './src/screens/RemindersTabScreen';
import SettingsTabScreen from './src/screens/SettingsTabScreen';
// import { sendVerificationEmail, updateMe } from './src/api/authApi';
// import { updateMe } from './src/api/authApi';
import { sendVerificationEmail } from './src/api/authApi';
import SignupScreen from './src/screens/SignupScreen';
import {
  clearReminderNotifications,
  getRemotePushToken,
  initializeNotifications,
  syncReminderNotifications,
} from './src/utils/notifications';
import { triggerErrorFeedback, triggerSuccessFeedback } from './src/utils/haptics';
import { isValidClockTime, parseClockTime, parseTimeToMinutes } from './src/utils/time';

const POLL_INTERVAL_MS = 4000;
const TouchableOpacity = HapticTouchable;

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeTaskStatus(task) {
  if (task.status) {
    return task.status;
  }

  return task.completed ? 'completed' : 'pending';
}

function formatTimeString(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function compareItemsBySchedule(a, b) {
  const dateCompare = String(a?.date || '').localeCompare(String(b?.date || ''));
  if (dateCompare !== 0) {
    return dateCompare;
  }

  return parseTimeToMinutes(a?.time || '') - parseTimeToMinutes(b?.time || '');
}

function filterItemsByStatus(items, status) {
  if (status === 'all') {
    return items;
  }

  return items.filter((item) => item.status === status);
}

function showMailVerificationPopup() {
  Alert.alert('Verification Required', 'Please Verify Your Mail In Settings First !');
}

function isMailVerificationRequired(error) {
  return error?.status === 403 && /verify your mail first/i.test(error?.message || '');
}

function getReminderTimestamp(reminder) {
  const parsedTime = parseClockTime(reminder.time);
  if (!parsedTime || !reminder.date) {
    return null;
  }

  const [year, month, day] = String(reminder.date)
    .split('-')
    .map((value) => Number(value));

  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return null;
  }

  const reminderDate = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0, 0);
  return Number.isNaN(reminderDate.getTime()) ? null : reminderDate.getTime();
}

export default function App() {
  const insets = useSafeAreaInsets();
  const androidStatusBarHeight = Platform.OS === 'android' ? NativeStatusBar.currentHeight || 0 : 0;
  const safeTopSpace = Math.max(insets.top, androidStatusBarHeight);
  const safeBottomSpace = Math.max(insets.bottom, 10);

  const todayISO = useMemo(() => toISODate(new Date()), []);

  const [authScreen, setAuthScreen] = useState('login');
  const [activeTab, setActiveTab] = useState('planner');
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPlannerTaskModal, setShowPlannerTaskModal] = useState(false);
  const [showTaskTimePicker, setShowTaskTimePicker] = useState(false);
  const [activeTaskActionItem, setActiveTaskActionItem] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [activeReminderActionItem, setActiveReminderActionItem] = useState(null);

  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskNotesInput, setTaskNotesInput] = useState('');
  const [taskTimeInput, setTaskTimeInput] = useState('');
  const [reminderTitleInput, setReminderTitleInput] = useState('');
  const [reminderNotesInput, setReminderNotesInput] = useState('');
  const [reminderTimeInput, setReminderTimeInput] = useState('');

  const [displayNameInput, setDisplayNameInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [user, setUser] = useState(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState([]);
  const [incomingAssignments, setIncomingAssignments] = useState([]);
  const [outgoingAssignments, setOutgoingAssignments] = useState([]);
  const [friendIncomingHistory, setFriendIncomingHistory] = useState([]);
  const [friendOutgoingHistory, setFriendOutgoingHistory] = useState([]);
  const [activeFriendActivity, setActiveFriendActivity] = useState(null);
  const [showFriendActivityModal, setShowFriendActivityModal] = useState(false);
  const [friendActivityLoading, setFriendActivityLoading] = useState(false);

  const [friendRequestFilter, setFriendRequestFilter] = useState('pending');
  const [incomingAssignmentFilter, setIncomingAssignmentFilter] = useState('pending');
  const [outgoingAssignmentFilter, setOutgoingAssignmentFilter] = useState('all');
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showFriendActionMenu, setShowFriendActionMenu] = useState(false);
  const [showFriendShareModal, setShowFriendShareModal] = useState(false);
  const [showFriendPickerModal, setShowFriendPickerModal] = useState(false);
  const [friendShareType, setFriendShareType] = useState('task');
  const [showFriendShareDatePicker, setShowFriendShareDatePicker] = useState(false);
  const [showFriendShareTimePicker, setShowFriendShareTimePicker] = useState(false);

  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [shareTitleInput, setShareTitleInput] = useState('');
  const [shareNotesInput, setShareNotesInput] = useState('');
  const [shareTimeInput, setShareTimeInput] = useState('');
  const [shareDateInput, setShareDateInput] = useState(todayISO);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [friendSearchInput, setFriendSearchInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState('');
  const [actionStatus, setActionStatus] = useState({
    visible: false,
    title: '',
    subtitle: '',
  });
  const notificationSnapshotRef = useRef({
    isPrimed: false,
    incomingFriendRequestIds: new Set(),
    outgoingFriendRequestStatuses: new Map(),
    incomingAssignmentIds: new Set(),
  });
  const registeredPushTokenRef = useRef(null);

  const welcomeText = useMemo(() => {
    if (!user) {
      return '';
    }

    return `Hello, ${user.displayName}`;
  }, [user]);

  const selectedTasks = useMemo(
    () => tasks.filter((task) => task.date === selectedDate),
    [tasks, selectedDate]
  );

  const selectedReminders = useMemo(
    () => reminders.filter((reminder) => reminder.date === selectedDate),
    [reminders, selectedDate]
  );

  const sortedReminders = useMemo(() => {
    return selectedReminders
      .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  }, [selectedReminders]);

  const roadmapTasks = useMemo(() => {
    return selectedTasks
      .filter((task) => Boolean(task.time))
      .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  }, [selectedTasks]);

  const unmanagedTasks = useMemo(() => {
    return selectedTasks.filter((task) => !task.time);
  }, [selectedTasks]);

  const statusCounts = useMemo(() => {
    return selectedTasks.reduce(
      (acc, task) => {
        const status = normalizeTaskStatus(task);
        if (status === 'completed') {
          acc.completed += 1;
        } else if (status === 'partial') {
          acc.partial += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { pending: 0, partial: 0, completed: 0 }
    );
  }, [selectedTasks]);

  const reminderCounts = useMemo(() => {
    return selectedReminders.reduce(
      (acc, reminder) => {
        if (reminder.done) {
          acc.completed += 1;
        } else {
          acc.pending += 1;
        }

        const reminderTimestamp = getReminderTimestamp(reminder);
        if (!reminder.done && reminderTimestamp && reminderTimestamp > Date.now()) {
          acc.upcoming += 1;
        }

        return acc;
      },
      { pending: 0, completed: 0, upcoming: 0 }
    );
  }, [selectedReminders]);

  const filteredFriends = useMemo(() => {
    const query = friendSearchInput.trim().toLowerCase();
    if (!query) {
      return friends;
    }

    return friends.filter((friend) => {
      const haystack = `${friend.displayName || ''} ${friend.username || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [friends, friendSearchInput]);

  const selectedFriendNames = useMemo(() => {
    const selectedSet = new Set(selectedFriendIds);
    return friends
      .filter((friend) => selectedSet.has(friend._id))
      .map((friend) => friend.displayName || friend.username);
  }, [friends, selectedFriendIds]);

  const incomingPlannerAssignments = useMemo(() => {
    return (incomingAssignments || [])
      .filter((assignment) => assignment.itemType === 'task' && assignment.status === 'pending')
      .sort(compareItemsBySchedule);
  }, [incomingAssignments]);

  const incomingReminderAssignments = useMemo(() => {
    return (incomingAssignments || [])
      .filter((assignment) => assignment.itemType === 'reminder' && assignment.status === 'pending')
      .sort(compareItemsBySchedule);
  }, [incomingAssignments]);

  const reminderNotificationPlan = useMemo(() => {
    return reminders
      .map((reminder) => ({
        _id: reminder._id,
        title: reminder.title,
        date: reminder.date,
        time: reminder.time,
        done: reminder.done,
        createdByName: reminder.createdBy?.displayName || reminder.createdBy?.username || '',
      }))
      .sort((a, b) => String(a._id).localeCompare(String(b._id)));
  }, [reminders]);

  const reminderNotificationSignature = useMemo(
    () => JSON.stringify(reminderNotificationPlan),
    [reminderNotificationPlan]
  );
  const reminderNotificationPlanRef = useRef(reminderNotificationPlan);
  reminderNotificationPlanRef.current = reminderNotificationPlan;

  const runWithActionFeedback = async ({ title, subtitle = 'Please wait a moment.', work }) => {
    setActionStatus({
      visible: true,
      title,
      subtitle,
    });

    try {
      const result = await work();
      await triggerSuccessFeedback();
      return result;
    } catch (actionError) {
      await triggerErrorFeedback();
      throw actionError;
    } finally {
      setActionStatus({
        visible: false,
        title: '',
        subtitle: '',
      });
    }
  };

  const refreshAllData = async (options = {}) => {
    try {
      await loadAllData(options);
      return true;
    } catch (requestError) {
      if (requestError?.status === 401) {
        setError('Your session expired. Please log in again.');
        setUser(null);
        return false;
      }

      setError(requestError?.message || 'Could not refresh your data right now.');
      return false;
    }
  };

  const syncLiveNotifications = async ({ friendRequestsData, incomingAssignmentsData, suppressNotifications }) => {
    const pendingIncomingFriendRequests = (friendRequestsData.incoming || []).filter(
      (request) => request.status === 'pending'
    );
    const pendingIncomingAssignments = (incomingAssignmentsData || []).filter(
      (assignment) => assignment.status === 'pending'
    );

    const nextIncomingFriendRequestIds = new Set(
      pendingIncomingFriendRequests.map((request) => String(request._id))
    );
    const nextOutgoingFriendRequestStatuses = new Map(
      (friendRequestsData.outgoing || []).map((request) => [String(request._id), request.status])
    );
    const nextIncomingAssignmentIds = new Set(
      pendingIncomingAssignments.map((assignment) => String(assignment._id))
    );

    const snapshot = notificationSnapshotRef.current;
    if (!snapshot.isPrimed || suppressNotifications) {
      notificationSnapshotRef.current = {
        isPrimed: true,
        incomingFriendRequestIds: nextIncomingFriendRequestIds,
        outgoingFriendRequestStatuses: nextOutgoingFriendRequestStatuses,
        incomingAssignmentIds: nextIncomingAssignmentIds,
      };
      return;
    }

    notificationSnapshotRef.current = {
      isPrimed: true,
      incomingFriendRequestIds: nextIncomingFriendRequestIds,
      outgoingFriendRequestStatuses: nextOutgoingFriendRequestStatuses,
      incomingAssignmentIds: nextIncomingAssignmentIds,
    };
  };

  const loadAllData = async ({ suppressNotifications = false, verifiedOverride } = {}) => {
    const canUseFriendFeatures = Boolean(verifiedOverride ?? user?.verified);
    const [
      taskData,
      reminderData,
      friendsData,
      friendRequestsData,
      incomingAssignmentsData,
      outgoingAssignmentsData,
    ] = await Promise.all([
      listTasks(),
      listReminders(),
      canUseFriendFeatures ? listFriends() : Promise.resolve({ friends: [] }),
      canUseFriendFeatures ? listFriendRequests('all') : Promise.resolve({ incoming: [], outgoing: [] }),
      canUseFriendFeatures ? listIncomingAssignments('all') : Promise.resolve([]),
      canUseFriendFeatures ? listOutgoingAssignments('all') : Promise.resolve([]),
    ]);

    setTasks(taskData);
    setReminders(reminderData);
    setFriends(friendsData.friends || []);
    setIncomingFriendRequests(filterItemsByStatus(friendRequestsData.incoming || [], friendRequestFilter));
    setOutgoingFriendRequests(filterItemsByStatus(friendRequestsData.outgoing || [], friendRequestFilter));
    setIncomingAssignments(filterItemsByStatus(incomingAssignmentsData || [], incomingAssignmentFilter));
    setOutgoingAssignments(filterItemsByStatus(outgoingAssignmentsData || [], outgoingAssignmentFilter));

    await syncLiveNotifications({
      friendRequestsData,
      incomingAssignmentsData,
      suppressNotifications: suppressNotifications || !canUseFriendFeatures,
    });
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    async function setupPushNotifications() {
      await initializeNotifications();

      const pushToken = await getRemotePushToken();
      if (!pushToken || isCancelled || registeredPushTokenRef.current === pushToken) {
        return;
      }

      try {
        await registerPushToken(pushToken);
        if (!isCancelled) {
          registeredPushTokenRef.current = pushToken;
        }
      } catch (pushTokenError) {
        // Keep the app usable even if push registration fails temporarily.
      }
    }

    setupPushNotifications();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const currentUser = await me();
        setUser(currentUser);
        await refreshAllData({ suppressNotifications: true, verifiedOverride: currentUser.verified });
      } catch (bootstrapError) {
        if (bootstrapError?.status === 401) {
          setUser(null);
        } else {
          setError(bootstrapError?.message || 'Could not restore your session right now.');
        }
      } finally {
        setBooting(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (user) {
      return undefined;
    }

    registeredPushTokenRef.current = null;
    notificationSnapshotRef.current = {
      isPrimed: false,
      incomingFriendRequestIds: new Set(),
      outgoingFriendRequestStatuses: new Map(),
      incomingAssignmentIds: new Set(),
    };

    clearReminderNotifications();
    return undefined;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    refreshAllData();
  }, [friendRequestFilter, incomingAssignmentFilter, outgoingAssignmentFilter]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalId = setInterval(() => {
      refreshAllData();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [user, friendRequestFilter, incomingAssignmentFilter, outgoingAssignmentFilter]);

  useEffect(() => {
    if (!user) {
      return;
    }

    syncReminderNotifications(reminderNotificationPlanRef.current);
  }, [user, reminderNotificationSignature]);

  const handleLogin = async ({ username, password }) => {
    setError('');
    setLoading(true);
    try {
      await runWithActionFeedback({
        title: 'Signing in',
        subtitle: 'Syncing your account and daily plan.',
        work: async () => {
          const authUser = await login({ username, password });
          setUser(authUser);
          await refreshAllData({ suppressNotifications: true, verifiedOverride: authUser.verified });
        },
      });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async ({ displayName, username, password }) => {
    setError('');
    setLoading(true);
    try {
      await runWithActionFeedback({
        title: 'Creating account',
        subtitle: 'Preparing your DoDaily workspace.',
        work: async () => {
          const authUser = await register({ displayName, username, password });
          setUser(authUser);
          await refreshAllData({ suppressNotifications: true, verifiedOverride: authUser.verified });
        },
      });
      return true;
    } catch (authError) {
      setError(authError.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async ({ title, notes, date, time }) => {
    setError('');
    setLoading(true);
    try {
      await runWithActionFeedback({
        title: 'Adding task',
        subtitle: 'Saving your planner task.',
        work: async () => {
          await createTask({ title, notes, date, time: time || '', status: 'pending' });
          await refreshAllData();
        },
      });
      return true;
    } catch (taskError) {
      setError(taskError.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cycleTaskStatus = async (task) => {
    const currentStatus = normalizeTaskStatus(task);
    const nextStatus =
      currentStatus === 'pending' ? 'partial' : currentStatus === 'partial' ? 'completed' : 'pending';

    setError('');
    try {
      await runWithActionFeedback({
        title: 'Updating task',
        subtitle: `Marking this task as ${nextStatus}.`,
        work: async () => {
          await updateTask(task._id, { status: nextStatus });
          await refreshAllData();
        },
      });
    } catch (taskError) {
      setError(taskError.message);
    }
  };

  const setTaskStatus = async (task, status) => {
    setError('');
    try {
      await runWithActionFeedback({
        title: status === 'completed' ? 'Completing task' : status === 'partial' ? 'Updating task' : 'Reopening task',
        subtitle: `Changing task status to ${status}.`,
        work: async () => {
          await updateTask(task._id, { status });
          await refreshAllData();
        },
      });
    } catch (taskError) {
      setError(taskError.message);
    } finally {
      setActiveTaskActionItem(null);
    }
  };

  const removeTask = async (taskId) => {
    setError('');
    try {
      await runWithActionFeedback({
        title: 'Deleting task',
        subtitle: 'Removing this planner task.',
        work: async () => {
          await deleteTaskById(taskId);
          await refreshAllData();
        },
      });
    } catch (taskError) {
      setError(taskError.message);
    }
  };

  const handleCreateReminder = async ({ title, time, notes, date }) => {
    const trimmedTime = time.trim();
    if (!trimmedTime) {
      setError('Reminder time is required');
      return;
    }

    if (!isValidClockTime(trimmedTime)) {
      setError('Enter reminder time like 09:30 or 09:30 AM');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await runWithActionFeedback({
        title: 'Adding reminder',
        subtitle: 'Scheduling your reminder.',
        work: async () => {
          await createReminder({ title, time: trimmedTime, notes, date });
          await refreshAllData();
        },
      });
      return true;
    } catch (reminderError) {
      setError(reminderError.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleReminderDone = async (reminder) => {
    setError('');
    try {
      await runWithActionFeedback({
        title: reminder.done ? 'Reopening reminder' : 'Completing reminder',
        subtitle: 'Updating reminder status.',
        work: async () => {
          await updateReminder(reminder._id, { done: !reminder.done });
          await refreshAllData();
        },
      });
    } catch (reminderError) {
      setError(reminderError.message);
    }
  };

  const removeReminder = async (reminderId) => {
    setError('');
    try {
      await runWithActionFeedback({
        title: 'Deleting reminder',
        subtitle: 'Removing this reminder.',
        work: async () => {
          await deleteReminder(reminderId);
          await refreshAllData();
        },
      });
    } catch (reminderError) {
      setError(reminderError.message);
    }
  };

  const setReminderDone = async (reminder, done) => {
    setError('');
    try {
      await runWithActionFeedback({
        title: done ? 'Completing reminder' : 'Reopening reminder',
        subtitle: 'Updating reminder status.',
        work: async () => {
          await updateReminder(reminder._id, { done });
          await refreshAllData();
        },
      });
    } catch (reminderError) {
      setError(reminderError.message);
    } finally {
      setActiveReminderActionItem(null);
    }
  };

  const addFriend = async () => {
    if (!user?.verified) {
      showMailVerificationPopup();
      return;
    }
    if (!friendUsernameInput.trim()) {
      setError('Enter a username to add friend');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await runWithActionFeedback({
        title: 'Sending request',
        subtitle: 'Sending your friend request.',
        work: async () => {
          await sendFriendRequest({ username: friendUsernameInput.trim() });
        },
      });
      setFriendUsernameInput('');
      setShowAddFriendModal(false);
      await refreshAllData();
      return true;
    } catch (friendError) {
      if (isMailVerificationRequired(friendError)) {
        showMailVerificationPopup();
        return false;
      }
      setError(friendError.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const answerFriendRequest = async (requestId, action) => {
    if (!user?.verified) {
      showMailVerificationPopup();
      return;
    }
    setError('');
    try {
      await runWithActionFeedback({
        title: action === 'approve' ? 'Approving request' : 'Rejecting request',
        subtitle: 'Updating this friend request.',
        work: async () => {
          await respondFriendRequest(requestId, action);
          await refreshAllData();
        },
      });
    } catch (friendError) {
      if (isMailVerificationRequired(friendError)) {
        showMailVerificationPopup();
        return;
      }
      setError(friendError.message);
    }
  };

  const answerAssignment = async (assignmentId, action, itemType) => {
    setError('');
    try {
      await runWithActionFeedback({
        title: action === 'approve' ? `Approving ${itemType}` : `Rejecting ${itemType}`,
        subtitle: `Updating this ${itemType} request.`,
        work: async () => {
          await respondAssignment(assignmentId, action);
          await refreshAllData();
        },
      });
    } catch (assignmentError) {
      setError(assignmentError.message);
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriendIds((current) => {
      if (current.includes(friendId)) {
        return current.filter((id) => id !== friendId);
      }

      return [...current, friendId];
    });
  };

  const sendSharedItem = async (type) => {
    if (!user?.verified) {
      showMailVerificationPopup();
      return;
    }
    if (!shareTitleInput.trim() || !shareDateInput.trim()) {
      setError('Title and date are required to share with friends');
      return;
    }
    if (type === 'reminder' && !shareTimeInput.trim()) {
      setError('Time is required when sharing reminder to friend');
      return;
    }
    if (selectedFriendIds.length === 0) {
      setError('Select at least one friend');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const sender = type === 'task' ? sendTaskToFriend : sendReminderToFriend;
      await runWithActionFeedback({
        title: type === 'task' ? 'Sending planner' : 'Sending reminder',
        subtitle: 'Sharing it with your selected friends.',
        work: async () => {
          await Promise.all(
            selectedFriendIds.map((friendId) =>
              sender({
                toUserId: friendId,
                title: shareTitleInput.trim(),
                notes: shareNotesInput.trim(),
                date: shareDateInput.trim(),
                time: shareTimeInput.trim(),
              })
            )
          );
        },
      });
      setShareTitleInput('');
      setShareNotesInput('');
      setShareTimeInput('');
      setSelectedFriendIds([]);
      setFriendSearchInput('');
      setShowFriendPickerModal(false);
      setShowFriendShareModal(false);
      await refreshAllData();
    } catch (shareError) {
      if (isMailVerificationRequired(shareError)) {
        showMailVerificationPopup();
        return;
      }
      setError(shareError.message);
    } finally {
      setLoading(false);
    }
  };

  const openFriendShareModal = (type) => {
    if (!user?.verified) {
      showMailVerificationPopup();
      return;
    }

    setFriendShareType(type);
    setShareTitleInput('');
    setShareNotesInput('');
    setShareTimeInput('');
    setShareDateInput(selectedDate);
    setSelectedFriendIds([]);
    setFriendSearchInput('');
    setShowFriendPickerModal(false);
    setShowFriendActionMenu(false);
    setShowFriendShareModal(true);
  };

  const saveProfile = async () => {
    setError('');
    setSavingProfile(true);
    try {
      const updatedUser = await runWithActionFeedback({
        title: 'Saving profile',
        subtitle: 'Updating your display name.',
        work: async () => updateMe({ displayName: displayNameInput }),
      });
      setUser(updatedUser);
      return true;
    } catch (profileError) {
      setError(profileError.message);
      return false;
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVerifyEmail = async (email) => {
    setError('');
    setVerifyingEmail(true);
    try {
      await runWithActionFeedback({
        title: 'Sending verification',
        subtitle: 'Updating your Gmail and sending the verification link.',
        work: async () => {
          const updatedUser = await updateMe({ email });
          setUser(updatedUser);
          await sendVerificationEmail();
        },
      });
      Alert.alert('Verification Email Sent', 'Check your Gmail inbox for the verification link.');
      return true;
    } catch (verificationError) {
      setError(verificationError.message || 'Failed to send verification email');
      return false;
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    setLoggingOut(true);
    try {
      await runWithActionFeedback({
        title: 'Logging out',
        subtitle: 'Closing this session on your device.',
        work: async () => {
          const currentPushToken = registeredPushTokenRef.current;
          if (currentPushToken) {
            try {
              await unregisterPushToken(currentPushToken);
            } catch (pushTokenError) {
              // Ignore push token removal errors and continue with logout.
            }
          }

          await logout();
        },
      });
      registeredPushTokenRef.current = null;
      clearReminderNotifications();
      setUser(null);
      setAuthScreen('login');
      setActiveTab('planner');
      setShowFriendActionMenu(false);
      setShowFriendRequestsModal(false);
      setShowFriendShareModal(false);
      setShowAddFriendModal(false);
      setShowFriendActivityModal(false);
      setShowReminderModal(false);
      setActiveFriendActivity(null);
      setActiveReminderActionItem(null);
    } catch (logoutError) {
      setError(logoutError.message);
    } finally {
      setLoggingOut(false);
    }
  };

  const openFriendActivityModal = async (friend) => {
    setError('');
    setActiveFriendActivity(friend);
    setShowFriendActivityModal(true);
    setFriendActivityLoading(true);

    try {
      const [allIncoming, allOutgoing] = await Promise.all([
        listIncomingAssignments('all'),
        listOutgoingAssignments('all'),
      ]);

      const friendId = String(friend._id || '');
      const incomingForFriend = (allIncoming || []).filter(
        (item) => String(item.fromUser?._id || item.fromUser || '') === friendId
      );
      const outgoingForFriend = (allOutgoing || []).filter(
        (item) => String(item.toUser?._id || item.toUser || '') === friendId
      );

      setFriendIncomingHistory(incomingForFriend);
      setFriendOutgoingHistory(outgoingForFriend);
    } catch (historyError) {
      setError(historyError.message);
      setFriendIncomingHistory([]);
      setFriendOutgoingHistory([]);
    } finally {
      setFriendActivityLoading(false);
    }
  };

  const openPlannerTaskModal = () => {
    setTaskTitleInput('');
    setTaskNotesInput('');
    setTaskTimeInput('');
    setShowPlannerTaskModal(true);
  };

  const openReminderModal = () => {
    setReminderTitleInput('');
    setReminderNotesInput('');
    setReminderTimeInput('');
    setShowReminderModal(true);
  };

  const submitPlannerTaskModal = async () => {
    if (!taskTitleInput.trim()) {
      setError('Task title is required');
      return;
    }

    const didCreateTask = await handleCreateTask({
      title: taskTitleInput.trim(),
      notes: taskNotesInput.trim(),
      date: selectedDate,
      time: taskTimeInput,
    });

    if (didCreateTask) {
      setShowPlannerTaskModal(false);
    }
  };

  const submitReminderModal = async () => {
    if (!reminderTitleInput.trim()) {
      setError('Reminder title is required');
      return;
    }

    if (!reminderTimeInput.trim()) {
      setError('Reminder time is required');
      return;
    }

    const didCreateReminder = await handleCreateReminder({
      title: reminderTitleInput.trim(),
      notes: reminderNotesInput.trim(),
      date: selectedDate,
      time: reminderTimeInput,
    });

    if (didCreateReminder) {
      setShowReminderModal(false);
    }
  };

  const openAddFriendModal = () => {
    if (!user?.verified) {
      showMailVerificationPopup();
      return;
    }

    setError('');
    setShowAddFriendModal(true);
  };

  const openFriendRequestsModal = () => {
    if (!user?.verified) {
      showMailVerificationPopup();
      return;
    }

    setShowFriendRequestsModal(true);
  };

  const openFriendActionMenu = () => {
    if (!user?.verified) {
      showMailVerificationPopup();
      return;
    }

    setError('');
    setShowFriendActionMenu(true);
  };

  if (booting) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        style={[styles.safeArea, { paddingTop: safeTopSpace, paddingBottom: safeBottomSpace }]}
      >
        <View style={styles.bgOrbTop} />
        <View style={styles.bgOrbBottom} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#0d7a76" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        style={[styles.safeArea, { paddingTop: safeTopSpace, paddingBottom: safeBottomSpace }]}
      >
        <View style={styles.bgOrbTop} />
        <View style={styles.bgOrbBottom} />
        <View style={styles.authWrap}>
          <View style={styles.authHeroCard}>
            <Text style={styles.authHeroEyebrow}>DoDaily</Text>
            <Text style={styles.authHeroTitle}>Plan better.{"\n"}Remember calmly.</Text>
            <Text style={styles.authHeroSubtitle}>
              A cleaner space for planners, reminders, friends, approvals, and timely alerts.
            </Text>
          </View>
          {authScreen === 'login' ? (
          <LoginScreen
            onLogin={handleLogin}
            loading={loading}
            error={error}
              onGoToSignup={() => {
                setError('');
                setAuthScreen('signup');
              }}
            />
          ) : (
            <SignupScreen
              onSignup={handleSignup}
              loading={loading}
              error={error}
              onGoToLogin={() => {
                setError('');
                setAuthScreen('login');
              }}
            />
          )}
        </View>
        <ActionStatusModal
          visible={actionStatus.visible}
          title={actionStatus.title}
          subtitle={actionStatus.subtitle}
        />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safeArea, { paddingTop: safeTopSpace, paddingBottom: safeBottomSpace }]}
    >
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />
      <View style={styles.container}>
          

        {activeTab === 'planner' || activeTab === 'reminders' ? (
          <>
            <DateBar
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setError('');
                setSelectedDate(date);
              }}
              onOpenPicker={() => setShowDatePicker(true)}
            />

            {showDatePicker ? (
              <DateTimePicker
                value={new Date(`${selectedDate}T00:00:00`)}
                mode="date"
                display="default"
                onChange={(event, pickedDate) => {
                  if (event.type === 'dismissed' || !pickedDate) {
                    setShowDatePicker(false);
                    return;
                  }

                  setSelectedDate(toISODate(pickedDate));
                  setError('');
                  setShowDatePicker(false);
                }}
              />
            ) : null}
          </>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#9a1f1f" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {activeTab === 'planner' ? (
          <PlannerTabScreen
            statusCounts={statusCounts}
            incomingPlannerAssignments={incomingPlannerAssignments}
            roadmapTasks={roadmapTasks}
            unmanagedTasks={unmanagedTasks}
            user={user}
            normalizeTaskStatus={normalizeTaskStatus}
            cycleTaskStatus={cycleTaskStatus}
            onAnswerIncomingPlanner={(assignmentId, action) => answerAssignment(assignmentId, action, 'planner')}
            onOpenTaskActions={setActiveTaskActionItem}
            onOpenCreateTask={openPlannerTaskModal}
          />
        ) : null}

        {activeTab === 'reminders' ? (
          <RemindersTabScreen
            reminderCounts={reminderCounts}
            incomingReminderAssignments={incomingReminderAssignments}
            sortedReminders={sortedReminders}
            user={user}
            onAnswerIncomingReminder={(assignmentId, action) => answerAssignment(assignmentId, action, 'reminder')}
            onToggleReminderDone={toggleReminderDone}
            onOpenReminderActions={setActiveReminderActionItem}
            onOpenCreateReminder={openReminderModal}
          />
        ) : null}

        {activeTab === 'friends' ? (
          <FriendsTabScreen
            friends={friends}
            incomingFriendRequests={incomingFriendRequests}
            onOpenAddFriendModal={openAddFriendModal}
            onOpenRequestsModal={openFriendRequestsModal}
            onOpenQuickAddModal={openFriendActionMenu}
            onSelectFriend={openFriendActivityModal}
          />
        ) : null}

        {activeTab === 'settings' ? (
          <SettingsTabScreen
            user={user}
            displayNameInput={displayNameInput}
            setDisplayNameInput={setDisplayNameInput}
            saveProfile={saveProfile}
            savingProfile={savingProfile}
            handleLogout={handleLogout}
            loggingOut={loggingOut}
            onVerifyEmail={handleVerifyEmail}
            verifyingEmail={verifyingEmail}
          />
        ) : null}

        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          showPlannerRequestDot={incomingPlannerAssignments.length > 0}
          showReminderRequestDot={incomingReminderAssignments.length > 0}
          showFriendRequestDot={incomingFriendRequests.length > 0}
        />
      </View>

      <Modal
        visible={showFriendActivityModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowFriendActivityModal(false)}
      >
        <View style={styles.friendActivityPage}>
          <View style={styles.friendActivityHeader}>
            <View style={styles.friendActivityTitleWrap}>
              <Text style={styles.friendActivityTitle}>{activeFriendActivity?.displayName || 'Friend Activity'}</Text>
              <Text style={styles.friendActivitySubtitle}>Sent and received planners/reminders</Text>
            </View>
            <TouchableOpacity style={styles.friendActivityCloseButton} onPress={() => setShowFriendActivityModal(false)}>
              <Text style={styles.friendActivityCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          {friendActivityLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#0d7a76" />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.friendActivitySection}>
                <Text style={styles.friendActivitySectionTitle}>Sent To {activeFriendActivity?.displayName || 'Friend'}</Text>
                {friendOutgoingHistory.length === 0 ? (
                  <Text style={styles.friendActivityEmpty}>No sent planners or reminders yet.</Text>
                ) : null}
                {friendOutgoingHistory.map((item) => (
                  <View key={item._id} style={styles.friendActivityCard}>
                    <View style={styles.friendActivityCardTop}>
                      <View style={[styles.friendActivityTypeBadge, item.itemType === 'task' ? styles.friendActivityPlannerBadge : styles.friendActivityReminderBadge]}>
                        <Text style={styles.friendActivityTypeText}>{item.itemType === 'task' ? 'Planner' : 'Reminder'}</Text>
                      </View>
                      <View style={[
                        styles.friendActivityStatusPill,
                        item.status === 'approved'
                          ? styles.friendActivityApproved
                          : item.status === 'rejected'
                            ? styles.friendActivityRejected
                            : styles.friendActivityPending,
                      ]}>
                        <Text style={styles.friendActivityStatusText}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.friendActivityCardTitle}>{item.title}</Text>
                    <Text style={styles.friendActivityCardMeta}>Date: {item.date}{item.time ? ` | Time: ${item.time}` : ''}</Text>
                    {item.notes ? <Text style={styles.friendActivityCardNotes}>{item.notes}</Text> : null}
                  </View>
                ))}
              </View>

              <View style={styles.friendActivitySection}>
                <Text style={styles.friendActivitySectionTitle}>Received From {activeFriendActivity?.displayName || 'Friend'}</Text>
                {friendIncomingHistory.length === 0 ? (
                  <Text style={styles.friendActivityEmpty}>No received planners or reminders yet.</Text>
                ) : null}
                {friendIncomingHistory.map((item) => (
                  <View key={item._id} style={styles.friendActivityCard}>
                    <View style={styles.friendActivityCardTop}>
                      <View style={[styles.friendActivityTypeBadge, item.itemType === 'task' ? styles.friendActivityPlannerBadge : styles.friendActivityReminderBadge]}>
                        <Text style={styles.friendActivityTypeText}>{item.itemType === 'task' ? 'Planner' : 'Reminder'}</Text>
                      </View>
                      <View style={[
                        styles.friendActivityStatusPill,
                        item.status === 'approved'
                          ? styles.friendActivityApproved
                          : item.status === 'rejected'
                            ? styles.friendActivityRejected
                            : styles.friendActivityPending,
                      ]}>
                        <Text style={styles.friendActivityStatusText}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.friendActivityCardTitle}>{item.title}</Text>
                    <Text style={styles.friendActivityCardMeta}>Date: {item.date}{item.time ? ` | Time: ${item.time}` : ''}</Text>
                    {item.notes ? <Text style={styles.friendActivityCardNotes}>{item.notes}</Text> : null}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal
        visible={showPlannerTaskModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlannerTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Planner Task</Text>
            <Text style={styles.composerHint}>Date: {selectedDate}</Text>

            <TextInput
              style={styles.input}
              placeholder="Task title"
              placeholderTextColor="#6f7f86"
              value={taskTitleInput}
              onChangeText={setTaskTitleInput}
            />

            <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowTaskTimePicker(true)}>
              <Text style={styles.timePickerText}>{taskTimeInput ? `Time: ${taskTimeInput}` : 'Pick Time (Optional)'}</Text>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#0d7a76" />
            </TouchableOpacity>

            {taskTimeInput ? (
              <TouchableOpacity style={styles.clearTimeButton} onPress={() => setTaskTimeInput('')}>
                <Text style={styles.clearTimeText}>Clear Time</Text>
              </TouchableOpacity>
            ) : null}

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Notes (optional)"
              placeholderTextColor="#6f7f86"
              value={taskNotesInput}
              onChangeText={setTaskNotesInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.settingsCancelButton} onPress={() => setShowPlannerTaskModal(false)}>
                <Text style={styles.settingsCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsSaveButton} onPress={submitPlannerTaskModal} disabled={loading}>
                <Text style={styles.settingsSaveText}>{loading ? 'Adding...' : 'Add Task'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(activeTaskActionItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTaskActionItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Task Actions</Text>
            <Text style={styles.composerHint}>{activeTaskActionItem?.title || 'Select an action'}</Text>

            <View style={styles.actionsMenu}>
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => setTaskStatus(activeTaskActionItem, 'pending')}
              >
                <Text style={styles.actionOptionText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => setTaskStatus(activeTaskActionItem, 'partial')}
              >
                <Text style={styles.actionOptionText}>Partially Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => setTaskStatus(activeTaskActionItem, 'completed')}
              >
                <Text style={styles.actionOptionText}>Completed</Text>
              </TouchableOpacity>
              {normalizeTaskStatus(activeTaskActionItem || {}) === 'pending' ? (
                <TouchableOpacity
                  style={[styles.actionOption, styles.actionDeleteOption]}
                  onPress={() => {
                    removeTask(activeTaskActionItem._id);
                    setActiveTaskActionItem(null);
                  }}
                >
                  <Text style={styles.actionDeleteText}>Delete</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.settingsCancelButton} onPress={() => setActiveTaskActionItem(null)}>
                <Text style={styles.settingsCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReminderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Reminder</Text>
            <Text style={styles.composerHint}>Date: {selectedDate}</Text>

            <TextInput
              style={styles.input}
              placeholder="Reminder title"
              placeholderTextColor="#6f7f86"
              value={reminderTitleInput}
              onChangeText={setReminderTitleInput}
            />

            <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowReminderTimePicker(true)}>
              <Text style={styles.timePickerText}>{reminderTimeInput ? `Time: ${reminderTimeInput}` : 'Pick Time (Required)'}</Text>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#0d7a76" />
            </TouchableOpacity>

            {reminderTimeInput ? (
              <TouchableOpacity style={styles.clearTimeButton} onPress={() => setReminderTimeInput('')}>
                <Text style={styles.clearTimeText}>Clear Time</Text>
              </TouchableOpacity>
            ) : null}

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Notes (optional)"
              placeholderTextColor="#6f7f86"
              value={reminderNotesInput}
              onChangeText={setReminderNotesInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.settingsCancelButton} onPress={() => setShowReminderModal(false)}>
                <Text style={styles.settingsCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsSaveButton} onPress={submitReminderModal} disabled={loading}>
                <Text style={styles.settingsSaveText}>{loading ? 'Adding...' : 'Add Reminder'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(activeReminderActionItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveReminderActionItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reminder Actions</Text>
            <Text style={styles.composerHint}>{activeReminderActionItem?.title || 'Select an action'}</Text>

            <View style={styles.actionsMenu}>
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => setReminderDone(activeReminderActionItem, false)}
              >
                <Text style={styles.actionOptionText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => setReminderDone(activeReminderActionItem, true)}
              >
                <Text style={styles.actionOptionText}>Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionOption, styles.actionDeleteOption]}
                onPress={() => {
                  removeReminder(activeReminderActionItem._id);
                  setActiveReminderActionItem(null);
                }}
              >
                <Text style={styles.actionDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.settingsCancelButton} onPress={() => setActiveReminderActionItem(null)}>
                <Text style={styles.settingsCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFriendActionMenu}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowFriendActionMenu(false)}
      >
        <View style={styles.friendActionModalOverlay}>
          <View style={styles.friendActionModalCard}>
            <Text style={styles.friendActionModalTitle}>Quick Add</Text>
            <Text style={styles.friendActionModalHint}>Pick one option</Text>

            <TouchableOpacity
              style={[styles.friendActionPopupButton, styles.friendPlannerActionButton]}
              onPress={() => openFriendShareModal('task')}
            >
              <View style={[styles.friendActionPopupIconWrap, styles.friendPlannerIconWrap]}>
                <MaterialCommunityIcons name="calendar-check-outline" size={18} color="#ffffff" />
              </View>
              <View style={styles.friendActionPopupTextWrap}>
                <Text style={[styles.friendActionPopupTitle, styles.friendActionPopupTitleLight]}>Add Planner</Text>
                <Text style={[styles.friendActionPopupSubtitle, styles.friendActionPopupSubtitleLight]}>Task + date</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.friendActionPopupButton, styles.friendReminderActionButton]}
              onPress={() => openFriendShareModal('reminder')}
            >
              <View style={[styles.friendActionPopupIconWrap, styles.friendReminderIconWrap]}>
                <MaterialCommunityIcons name="bell-outline" size={18} color="#ffffff" />
              </View>
              <View style={styles.friendActionPopupTextWrap}>
                <Text style={[styles.friendActionPopupTitle, styles.friendActionPopupTitleLight]}>Add Reminder</Text>
                <Text style={[styles.friendActionPopupSubtitle, styles.friendActionPopupSubtitleLight]}>Date + time</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.settingsCancelButton} onPress={() => setShowFriendActionMenu(false)}>
                <Text style={styles.settingsCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddFriendModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddFriendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <Text style={styles.composerHint}>Enter your friend's username to send a request.</Text>

            <TextInput
              style={styles.input}
              placeholder="Friend username"
              placeholderTextColor="#6f7f86"
              value={friendUsernameInput}
              onChangeText={setFriendUsernameInput}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.settingsCancelButton} onPress={() => setShowAddFriendModal(false)}>
                <Text style={styles.settingsCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsSaveButton} onPress={addFriend} disabled={loading}>
                <Text style={styles.settingsSaveText}>{loading ? 'Sending...' : 'Send Request'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFriendRequestsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFriendRequestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <Text style={styles.modalTitle}>Friend Requests</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {incomingFriendRequests.length > 0 ? (
                <Text style={styles.sectionMiniTitle}>Incoming Friend Requests</Text>
              ) : null}
              {incomingFriendRequests.length === 0 ? <Text style={styles.emptyText}>No incoming friend requests.</Text> : null}
              {incomingFriendRequests.map((request) => (
                <View key={request._id} style={styles.requestRow}>
                  <Text style={styles.friendPrimary}>{request.fromUser.displayName} (@{request.fromUser.username})</Text>
                  {request.status === 'pending' ? (
                    <View style={styles.requestActions}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => answerFriendRequest(request._id, 'approve')}>
                        <Text style={styles.approveText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => answerFriendRequest(request._id, 'reject')}>
                        <Text style={styles.rejectText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.friendSecondary}>Status: {request.status}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.settingsCancelButton} onPress={() => setShowFriendRequestsModal(false)}>
                <Text style={styles.settingsCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFriendShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFriendShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {friendShareType === 'task' ? 'Add Planner For Friend' : 'Add Reminder For Friend'}
            </Text>

            <TouchableOpacity style={styles.selectFriendsButton} onPress={() => setShowFriendPickerModal(true)}>
              <MaterialCommunityIcons name="account-multiple-plus-outline" size={18} color="#ffffff" />
              <Text style={styles.selectFriendsButtonText}>
                {selectedFriendIds.length > 0
                  ? `Selected Friends (${selectedFriendIds.length})`
                  : 'Select Friends'}
              </Text>
            </TouchableOpacity>

            {selectedFriendNames.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedFriendsPreviewRow}
              >
                {selectedFriendNames.map((name) => (
                  <View key={name} style={styles.selectedFriendPill}>
                    <Text style={styles.selectedFriendPillText}>{name}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.selectedFriendsHint}>No friends selected yet.</Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#6f7f86"
              value={shareTitleInput}
              onChangeText={setShareTitleInput}
            />

            <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowFriendShareDatePicker(true)}>
              <Text style={styles.timePickerText}>Date: {shareDateInput || 'Pick Date'}</Text>
              <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#0d7a76" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowFriendShareTimePicker(true)}>
              <Text style={styles.timePickerText}>Time: {shareTimeInput || (friendShareType === 'task' ? 'Optional' : 'Required')}</Text>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#0d7a76" />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Notes (optional)"
              placeholderTextColor="#6f7f86"
              value={shareNotesInput}
              onChangeText={setShareNotesInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.settingsCancelButton} onPress={() => setShowFriendShareModal(false)}>
                <Text style={styles.settingsCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsSaveButton} onPress={() => sendSharedItem(friendShareType)} disabled={loading}>
                <Text style={styles.settingsSaveText}>{loading ? 'Sending...' : 'Send For Approval'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFriendPickerModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowFriendPickerModal(false)}
      >
        <View style={styles.friendPickerPage}>
          <View style={styles.friendPickerHeader}>
            <Text style={styles.friendPickerTitle}>Select Friends</Text>
            <TouchableOpacity style={styles.friendPickerCloseButton} onPress={() => setShowFriendPickerModal(false)}>
              <Text style={styles.friendPickerCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.friendPickerSearchWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color="#5f736f" />
            <TextInput
              style={styles.friendPickerSearchInput}
              placeholder="Search friends"
              placeholderTextColor="#6f7f86"
              value={friendSearchInput}
              onChangeText={setFriendSearchInput}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.friendPickerList}
            ListEmptyComponent={<Text style={styles.emptyText}>No friends found.</Text>}
            renderItem={({ item }) => {
              const selected = selectedFriendIds.includes(item._id);
              return (
                <TouchableOpacity
                  style={[styles.friendPickerRow, selected && styles.friendPickerRowSelected]}
                  onPress={() => toggleFriendSelection(item._id)}
                >
                  <View style={styles.friendPickerRowLeft}>
                    <View style={[styles.friendPickerLeadingIconWrap, selected && styles.friendPickerLeadingIconWrapSelected]}>
                      <MaterialCommunityIcons
                        name={selected ? 'check' : 'plus'}
                        size={16}
                        color={selected ? '#ffffff' : '#0d7a76'}
                      />
                    </View>
                    <View>
                      <Text style={styles.friendPickerName}>{item.displayName}</Text>
                      <Text style={styles.friendPickerUsername}>@{item.username}</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={selected ? 'check-circle' : 'plus-circle-outline'}
                    size={22}
                    color={selected ? '#0d7a76' : '#7b8d93'}
                  />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {showTaskTimePicker ? (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={(event, pickedDate) => {
            if (event.type === 'dismissed' || !pickedDate) {
              setShowTaskTimePicker(false);
              return;
            }

            setTaskTimeInput(formatTimeString(pickedDate));
            setShowTaskTimePicker(false);
          }}
        />
      ) : null}

      {showReminderTimePicker ? (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={(event, pickedDate) => {
            if (event.type === 'dismissed' || !pickedDate) {
              setShowReminderTimePicker(false);
              return;
            }

            setReminderTimeInput(formatTimeString(pickedDate));
            setShowReminderTimePicker(false);
          }}
        />
      ) : null}

      {showFriendShareDatePicker ? (
        <DateTimePicker
          value={new Date(`${shareDateInput || toISODate(new Date())}T00:00:00`)}
          mode="date"
          display="default"
          onChange={(event, pickedDate) => {
            if (event.type === 'dismissed' || !pickedDate) {
              setShowFriendShareDatePicker(false);
              return;
            }

            setShareDateInput(toISODate(pickedDate));
            setShowFriendShareDatePicker(false);
          }}
        />
      ) : null}

      {showFriendShareTimePicker ? (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={(event, pickedDate) => {
            if (event.type === 'dismissed' || !pickedDate) {
              setShowFriendShareTimePicker(false);
              return;
            }

            setShareTimeInput(formatTimeString(pickedDate));
            setShowFriendShareTimePicker(false);
          }}
        />
      ) : null}

      <ActionStatusModal
        visible={actionStatus.visible}
        title={actionStatus.title}
        subtitle={actionStatus.subtitle}
      />

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef5f1',
  },
  bgOrbTop: {
    position: 'absolute',
    top: -120,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#cbeee1',
    opacity: 0.9,
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: -150,
    left: -70,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#fbe2bb',
    opacity: 0.72,
  },
  authWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  authHeroCard: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(11, 92, 88, 0.94)',
    shadowColor: '#103733',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  authHeroEyebrow: {
    color: '#d6f2ea',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  authHeroTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: 8,
  },
  authHeroSubtitle: {
    color: '#d9efeb',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  friendActivityPage: {
    flex: 1,
    backgroundColor: '#f3f7f4',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  friendActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendActivityTitleWrap: {
    flex: 1,
    marginRight: 12,
  },
  friendActivityTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#173238',
  },
  friendActivitySubtitle: {
    color: '#4f6664',
    marginTop: 2,
    fontSize: 12,
  },
  friendActivityCloseButton: {
    backgroundColor: '#0d7a76',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  friendActivityCloseText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  friendActivitySection: {
    marginBottom: 14,
  },
  friendActivitySectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18423f',
    marginBottom: 8,
  },
  friendActivityEmpty: {
    color: '#5f736f',
    fontSize: 13,
    marginBottom: 6,
  },
  friendActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4ece3',
    padding: 10,
    marginBottom: 8,
  },
  friendActivityCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  friendActivityTypeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  friendActivityPlannerBadge: {
    backgroundColor: '#e8f8f3',
  },
  friendActivityReminderBadge: {
    backgroundColor: '#eaf1ff',
  },
  friendActivityTypeText: {
    color: '#18423f',
    fontWeight: '800',
    fontSize: 11,
  },
  friendActivityStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  friendActivityPending: {
    backgroundColor: '#ffedd3',
  },
  friendActivityApproved: {
    backgroundColor: '#dff6e8',
  },
  friendActivityRejected: {
    backgroundColor: '#ffe6e1',
  },
  friendActivityStatusText: {
    color: '#18423f',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  friendActivityCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173238',
  },
  friendActivityCardMeta: {
    color: '#536765',
    marginTop: 3,
    fontSize: 12,
  },
  friendActivityCardNotes: {
    color: '#5d7571',
    marginTop: 4,
    fontSize: 12,
  },
  headerCard: {
    backgroundColor: '#0f6f6b',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#0c4d48',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
  headerCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerDateText: {
    color: '#e7f7f3',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
  headerTextWrap: {
    maxWidth: '92%',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#dcefeb',
    marginTop: 6,
    lineHeight: 19,
  },
  settingsCancelButton: {
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    backgroundColor: '#f6fcfa',
  },
  settingsCancelText: {
    color: '#2f635c',
    fontWeight: '700',
  },
  settingsSaveButton: {
    backgroundColor: '#0d7a76',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  settingsSaveText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  composerHint: {
    fontSize: 12,
    color: '#4f6664',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#f9fdfb',
    color: '#173238',
  },
  multilineInput: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  modalCardLarge: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d7e9e3',
    padding: 16,
    maxHeight: '78%',
    shadowColor: '#163632',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  selectFriendsButton: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: '#2d73c9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectFriendsButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    marginLeft: 8,
  },
  selectedFriendsPreviewRow: {
    paddingBottom: 6,
  },
  selectedFriendPill: {
    backgroundColor: '#e8f1ff',
    borderColor: '#c5d8ff',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  selectedFriendPillText: {
    color: '#1f4e96',
    fontWeight: '700',
    fontSize: 12,
  },
  selectedFriendsHint: {
    color: '#5f736f',
    marginBottom: 8,
    fontSize: 12,
  },
  friendPickerPage: {
    flex: 1,
    backgroundColor: '#f3f7f4',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  friendPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendPickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#173238',
  },
  friendPickerCloseButton: {
    backgroundColor: '#0d7a76',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  friendPickerCloseText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  friendPickerSearchWrap: {
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  friendPickerSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#173238',
  },
  friendPickerList: {
    paddingBottom: 14,
  },
  friendPickerRow: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4ece3',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendPickerRowSelected: {
    borderColor: '#a9d5ca',
    backgroundColor: '#f0fbf7',
  },
  friendPickerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendPickerLeadingIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#b9ddd5',
    backgroundColor: '#eaf8f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  friendPickerLeadingIconWrapSelected: {
    backgroundColor: '#0d7a76',
    borderColor: '#0d7a76',
  },
  friendPickerName: {
    color: '#173238',
    fontWeight: '700',
    fontSize: 14,
  },
  friendPickerUsername: {
    color: '#5d7571',
    fontSize: 12,
    marginTop: 2,
  },
  friendActionModalCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4ece3',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 290,
    shadowColor: '#0d4f4a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 8,
  },
  friendActionModalOverlay: {
    flex: 1,
    backgroundColor: '#eaf4ef',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  friendActionModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#173238',
    textAlign: 'center',
  },
  friendActionModalHint: {
    fontSize: 12,
    color: '#4f6664',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  friendActionPopupButton: {
    borderWidth: 0,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendPlannerActionButton: {
    backgroundColor: '#e67e22',
  },
  friendReminderActionButton: {
    backgroundColor: '#2563eb',
  },
  friendActionPopupIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  friendPlannerIconWrap: {
    backgroundColor: '#b85f12',
  },
  friendReminderIconWrap: {
    backgroundColor: '#1e40af',
  },
  friendActionPopupTextWrap: {
    flex: 1,
  },
  friendActionPopupTitle: {
    color: '#173238',
    fontWeight: '800',
    fontSize: 14,
  },
  friendActionPopupSubtitle: {
    color: '#5b7470',
    marginTop: 2,
    fontSize: 12,
  },
  friendActionPopupTitleLight: {
    color: '#ffffff',
  },
  friendActionPopupSubtitleLight: {
    color: '#e8f1ff',
  },
  actionsMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#dcebe6',
    borderRadius: 14,
    backgroundColor: '#fbfdfc',
    overflow: 'hidden',
  },
  actionOption: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e3f1ed',
  },
  actionOptionText: {
    color: '#194341',
    fontWeight: '700',
    fontSize: 13,
  },
  actionDeleteOption: {
    backgroundColor: '#fff4ef',
    borderBottomWidth: 0,
  },
  actionDeleteText: {
    color: '#ba4b30',
    fontWeight: '800',
    fontSize: 13,
  },
  friendPrimary: {
    color: '#173238',
    fontWeight: '700',
    fontSize: 13,
  },
  friendSecondary: {
    color: '#5d7571',
    marginTop: 2,
    fontSize: 12,
  },
  sectionMiniTitle: {
    color: '#244644',
    fontWeight: '800',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 8,
  },
  requestRow: {
    borderWidth: 1,
    borderColor: '#d4ece3',
    borderRadius: 12,
    backgroundColor: '#f9fdfb',
    padding: 10,
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  approveBtn: {
    backgroundColor: '#0d7a76',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  approveText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  rejectBtn: {
    backgroundColor: '#fff0eb',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rejectText: {
    color: '#ba4b30',
    fontWeight: '800',
    fontSize: 12,
  },
  errorText: {
    color: '#9a1f1f',
    fontWeight: '700',
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f1',
    borderWidth: 1,
    borderColor: '#f1c4be',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 35, 33, 0.42)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d7e9e3',
    padding: 16,
    shadowColor: '#163632',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#173238',
    marginBottom: 4,
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#f9fdfb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timePickerText: {
    color: '#2e5d58',
    fontWeight: '700',
  },
  emptyText: {
    color: '#5f736f',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  clearTimeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff0eb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  clearTimeText: {
    color: '#ba4b30',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
});
