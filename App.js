import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { login, logout, me, register, updateMe } from './src/api/authApi';
import BottomNav from './src/components/BottomNav';
import DateBar from './src/components/DateBar';
import ReminderComposer from './src/components/ReminderComposer';
import {
  getFriendBadges,
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
import SignupScreen from './src/screens/SignupScreen';

let PushNotification;
try {
  // Non-Expo React Native notifications module (requires native build/dev client)
  const imported = require('react-native-push-notification');
  PushNotification = imported.default || imported;
} catch (error) {
  PushNotification = null;
}

function setupNotificationChannel() {
  try {
    PushNotification?.createChannel?.(
      {
        channelId: 'friend-requests',
        channelName: 'Friend Requests',
      },
      () => {}
    );
  } catch (error) {
    // Ignore notification setup failures in unsupported environments.
  }
}

function sendLocalFriendNotification() {
  try {
    PushNotification?.localNotification?.({
      channelId: 'friend-requests',
      title: 'New Planner Request',
      message: 'A friend sent you a planner/reminder request for approval.',
    });
  } catch (error) {
    // Ignore local notification failures in unsupported environments.
  }
}

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

function parseTimeToMinutes(timeText) {
  if (!timeText) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parts = timeText.split(':');
  if (parts.length < 2) {
    return Number.MAX_SAFE_INTEGER;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hours * 60 + minutes;
}

function formatTimeString(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
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

  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskNotesInput, setTaskNotesInput] = useState('');
  const [taskTimeInput, setTaskTimeInput] = useState('');

  const [displayNameInput, setDisplayNameInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [user, setUser] = useState(null);
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
  const [pendingApprovalsBadge, setPendingApprovalsBadge] = useState(0);

  const [friendRequestFilter, setFriendRequestFilter] = useState('pending');
  const [incomingAssignmentFilter, setIncomingAssignmentFilter] = useState('pending');
  const [outgoingAssignmentFilter, setOutgoingAssignmentFilter] = useState('all');
  const [lastIncomingAssignmentCount, setLastIncomingAssignmentCount] = useState(0);
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

  const loadAllData = async () => {
    const [
      taskData,
      reminderData,
      friendsData,
      friendRequestsData,
      incomingAssignmentsData,
      outgoingAssignmentsData,
      badgeData,
    ] = await Promise.all([
      listTasks(),
      listReminders(),
      listFriends(),
      listFriendRequests(friendRequestFilter),
      listIncomingAssignments(incomingAssignmentFilter),
      listOutgoingAssignments(outgoingAssignmentFilter),
      getFriendBadges(),
    ]);

    setTasks(taskData);
    setReminders(reminderData);
    setFriends(friendsData.friends || []);
    setIncomingFriendRequests(friendRequestsData.incoming || []);
    setOutgoingFriendRequests(friendRequestsData.outgoing || []);
    setIncomingAssignments(incomingAssignmentsData || []);
    setOutgoingAssignments(outgoingAssignmentsData || []);
    setPendingApprovalsBadge(badgeData.totalPendingApprovals || 0);

    if (incomingAssignmentFilter === 'pending') {
      const currentCount = (incomingAssignmentsData || []).length;
      if (lastIncomingAssignmentCount > 0 && currentCount > lastIncomingAssignmentCount) {
        sendLocalFriendNotification();
      }
      setLastIncomingAssignmentCount(currentCount);
    }
  };

  useEffect(() => {
    setupNotificationChannel();
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const currentUser = await me();
        setUser(currentUser);
        await loadAllData();
      } catch (bootstrapError) {
        setUser(null);
      } finally {
        setBooting(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    loadAllData();
  }, [friendRequestFilter, incomingAssignmentFilter, outgoingAssignmentFilter]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalId = setInterval(() => {
      loadAllData();
    }, 12000);

    return () => clearInterval(intervalId);
  }, [user, friendRequestFilter, incomingAssignmentFilter, outgoingAssignmentFilter]);

  const handleLogin = async ({ username, password }) => {
    setError('');
    setLoading(true);
    try {
      const authUser = await login({ username, password });
      setUser(authUser);
      await loadAllData();
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
      const authUser = await register({ displayName, username, password });
      setUser(authUser);
      await loadAllData();
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async ({ title, notes, date, time }) => {
    setError('');
    setLoading(true);
    try {
      await createTask({ title, notes, date, time: time || '', status: 'pending' });
      await loadAllData();
    } catch (taskError) {
      setError(taskError.message);
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
      await updateTask(task._id, { status: nextStatus });
      await loadAllData();
    } catch (taskError) {
      setError(taskError.message);
    }
  };

  const setTaskStatus = async (task, status) => {
    setError('');
    try {
      await updateTask(task._id, { status });
      await loadAllData();
    } catch (taskError) {
      setError(taskError.message);
    } finally {
      setActiveTaskActionItem(null);
    }
  };

  const removeTask = async (taskId) => {
    setError('');
    try {
      await deleteTaskById(taskId);
      await loadAllData();
    } catch (taskError) {
      setError(taskError.message);
    }
  };

  const handleCreateReminder = async ({ title, time, notes, date }) => {
    setError('');
    setLoading(true);
    try {
      await createReminder({ title, time, notes, date });
      await loadAllData();
    } catch (reminderError) {
      setError(reminderError.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminderDone = async (reminder) => {
    setError('');
    try {
      await updateReminder(reminder._id, { done: !reminder.done });
      await loadAllData();
    } catch (reminderError) {
      setError(reminderError.message);
    }
  };

  const removeReminder = async (reminderId) => {
    setError('');
    try {
      await deleteReminder(reminderId);
      await loadAllData();
    } catch (reminderError) {
      setError(reminderError.message);
    }
  };

  const addFriend = async () => {
    if (!friendUsernameInput.trim()) {
      setError('Enter a username to add friend');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await sendFriendRequest({ username: friendUsernameInput.trim() });
      setFriendUsernameInput('');
      setShowAddFriendModal(false);
      await loadAllData();
    } catch (friendError) {
      setError(friendError.message);
    } finally {
      setLoading(false);
    }
  };

  const answerFriendRequest = async (requestId, action) => {
    setError('');
    try {
      await respondFriendRequest(requestId, action);
      await loadAllData();
    } catch (friendError) {
      setError(friendError.message);
    }
  };

  const answerAssignment = async (assignmentId, action) => {
    setError('');
    try {
      await respondAssignment(assignmentId, action);
      await loadAllData();
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

      setShareTitleInput('');
      setShareNotesInput('');
      setShareTimeInput('');
      setSelectedFriendIds([]);
      setFriendSearchInput('');
      setShowFriendPickerModal(false);
      setShowFriendShareModal(false);
      await loadAllData();
    } catch (shareError) {
      setError(shareError.message);
    } finally {
      setLoading(false);
    }
  };

  const openFriendShareModal = (type) => {
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
      const updatedUser = await updateMe({ displayName: displayNameInput });
      setUser(updatedUser);
    } catch (profileError) {
      setError(profileError.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    setLoggingOut(true);
    try {
      await logout();
      setUser(null);
      setAuthScreen('login');
      setActiveTab('planner');
      setShowFriendActionMenu(false);
      setShowFriendRequestsModal(false);
      setShowFriendShareModal(false);
      setShowAddFriendModal(false);
      setShowFriendActivityModal(false);
      setActiveFriendActivity(null);
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

  const submitPlannerTaskModal = async () => {
    if (!taskTitleInput.trim()) {
      setError('Task title is required');
      return;
    }

    await handleCreateTask({
      title: taskTitleInput.trim(),
      notes: taskNotesInput.trim(),
      date: selectedDate,
      time: taskTimeInput,
    });

    setShowPlannerTaskModal(false);
  };

  const openAddFriendModal = () => {
    setError('');
    setShowAddFriendModal(true);
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
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.welcomeTitle}>{welcomeText}</Text>
            <Text style={styles.subtitle}>
              {activeTab === 'planner'
                ? 'Date-wise planner overview'
                : activeTab === 'reminders'
                  ? 'Your personal reminders'
                  : activeTab === 'friends'
                    ? 'Friends, requests and approvals'
                  : 'Manage your profile details'}
            </Text>
          </View>
        </View>

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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {activeTab === 'planner' ? (
          <PlannerTabScreen
            statusCounts={statusCounts}
            roadmapTasks={roadmapTasks}
            unmanagedTasks={unmanagedTasks}
            user={user}
            normalizeTaskStatus={normalizeTaskStatus}
            cycleTaskStatus={cycleTaskStatus}
            onOpenTaskActions={setActiveTaskActionItem}
            onOpenCreateTask={openPlannerTaskModal}
          />
        ) : null}

        {activeTab === 'reminders' ? (
          <RemindersTabScreen
            selectedDate={selectedDate}
            handleCreateReminder={handleCreateReminder}
            loading={loading}
            selectedReminders={selectedReminders}
            user={user}
            toggleReminderDone={toggleReminderDone}
            removeReminder={removeReminder}
          />
        ) : null}

        {activeTab === 'friends' ? (
          <FriendsTabScreen
            friends={friends}
            incomingFriendRequests={incomingFriendRequests}
            onOpenAddFriendModal={openAddFriendModal}
            onOpenRequestsModal={() => setShowFriendRequestsModal(true)}
            onOpenQuickAddModal={() => setShowFriendActionMenu(true)}
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
          />
        ) : null}

        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
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
                <Text style={styles.settingsSaveText}>{loading ? 'Saving...' : 'Add Task'}</Text>
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
            <Text style={styles.modalTitle}>Friend Requests & Approvals</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionMiniTitle}>Incoming Friend Requests</Text>
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

              <Text style={styles.sectionMiniTitle}>Incoming Planner/Reminder Approval Requests</Text>
              {incomingAssignments.length === 0 ? <Text style={styles.emptyText}>No incoming item approvals.</Text> : null}
              {incomingAssignments.map((item) => (
                <View key={item._id} style={styles.requestRow}>
                  <Text style={styles.friendPrimary}>
                    {item.fromUser.displayName} sent {item.itemType}: {item.title}
                  </Text>
                  <Text style={styles.friendSecondary}>Date: {item.date}{item.time ? ` | Time: ${item.time}` : ''}</Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => answerAssignment(item._id, 'approve')}>
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => answerAssignment(item._id, 'reject')}>
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
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
              <TouchableOpacity style={styles.settingsSaveButton} onPress={() => sendSharedItem(friendShareType)}>
                <Text style={styles.settingsSaveText}>Send For Approval</Text>
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

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f7f4',
  },
  bgOrbTop: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#c7f3de',
    opacity: 0.82,
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: -140,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#ffe4b8',
    opacity: 0.74,
  },
  authWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d4ece3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#173238',
  },
  subtitle: {
    fontSize: 13,
    color: '#4f6664',
    marginTop: 4,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d4ece3',
    padding: 14,
    maxHeight: '78%',
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
    borderColor: '#d4ece3',
    borderRadius: 12,
    backgroundColor: '#f9fdfb',
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
    marginBottom: 8,
    fontWeight: '600',
  },
  addFloatingButton: {
    position: 'absolute',
    left: 4,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0d7a76',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d4f4a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 35, 33, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d4ece3',
    padding: 14,
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
