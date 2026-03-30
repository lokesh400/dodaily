import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HapticTouchable from './HapticTouchable';

const TouchableOpacity = HapticTouchable;

export default function BottomNav({
  activeTab,
  onChangeTab,
  showPlannerRequestDot,
  showReminderRequestDot,
  showFriendRequestDot,
}) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'planner' && styles.navButtonActive]}
        onPress={() => onChangeTab('planner')}
      >
        <MaterialCommunityIcons
          name="calendar-check-outline"
          size={16}
          color={activeTab === 'planner' ? '#ffffff' : '#2f635c'}
        />
        <Text style={[styles.navLabel, activeTab === 'planner' && styles.navLabelActive]}>Planner</Text>
        {showPlannerRequestDot ? <View style={styles.notificationDot} /> : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, activeTab === 'reminders' && styles.navButtonActive]}
        onPress={() => onChangeTab('reminders')}
      >
        <MaterialCommunityIcons
          name="bell-outline"
          size={16}
          color={activeTab === 'reminders' ? '#ffffff' : '#2f635c'}
        />
        <Text style={[styles.navLabel, activeTab === 'reminders' && styles.navLabelActive]}>Reminders</Text>
        {showReminderRequestDot ? <View style={styles.notificationDot} /> : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, activeTab === 'friends' && styles.navButtonActive]}
        onPress={() => onChangeTab('friends')}
      >
        <MaterialCommunityIcons
          name="account-group-outline"
          size={16}
          color={activeTab === 'friends' ? '#ffffff' : '#2f635c'}
        />
        <Text style={[styles.navLabel, activeTab === 'friends' && styles.navLabelActive]}>Friends</Text>
        {showFriendRequestDot ? <View style={styles.notificationDot} /> : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, activeTab === 'settings' && styles.navButtonActive]}
        onPress={() => onChangeTab('settings')}
      >
        <MaterialCommunityIcons
          name="cog-outline"
          size={16}
          color={activeTab === 'settings' ? '#ffffff' : '#2f635c'}
        />
        <Text style={[styles.navLabel, activeTab === 'settings' && styles.navLabelActive]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#d7e9e3',
    marginTop: 8,
    shadowColor: '#153732',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  navButton: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 7,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonActive: {
    backgroundColor: '#0d7a76',
    shadowColor: '#0b5c58',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  navLabel: {
    color: '#2f635c',
    marginTop: 2,
    fontSize: 10,
    fontWeight: '800',
  },
  navLabelActive: {
    color: '#ffffff',
  },
  notificationDot: {
    position: 'absolute',
    right: 18,
    top: 8,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#d93025',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
