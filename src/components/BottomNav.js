import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BottomNav({ activeTab, onChangeTab, showFriendRequestDot }) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'planner' && styles.navButtonActive]}
        onPress={() => onChangeTab('planner')}
      >
        <MaterialCommunityIcons name="calendar-check-outline" size={17} color={activeTab === 'planner' ? '#ffffff' : '#2f635c'} />
        <Text style={[styles.navLabel, activeTab === 'planner' && styles.navLabelActive]}>Planner</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, activeTab === 'reminders' && styles.navButtonActive]}
        onPress={() => onChangeTab('reminders')}
      >
        <MaterialCommunityIcons name="bell-outline" size={17} color={activeTab === 'reminders' ? '#ffffff' : '#2f635c'} />
        <Text style={[styles.navLabel, activeTab === 'reminders' && styles.navLabelActive]}>Reminders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, activeTab === 'friends' && styles.navButtonActive]}
        onPress={() => onChangeTab('friends')}
      >
        <MaterialCommunityIcons name="account-group-outline" size={17} color={activeTab === 'friends' ? '#ffffff' : '#2f635c'} />
        <Text style={[styles.navLabel, activeTab === 'friends' && styles.navLabelActive]}>Friends</Text>
        {showFriendRequestDot ? <View style={styles.friendRequestDot} /> : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, activeTab === 'settings' && styles.navButtonActive]}
        onPress={() => onChangeTab('settings')}
      >
        <MaterialCommunityIcons name="cog-outline" size={17} color={activeTab === 'settings' ? '#ffffff' : '#2f635c'} />
        <Text style={[styles.navLabel, activeTab === 'settings' && styles.navLabelActive]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#d4ece3',
    marginTop: 8,
  },
  navButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonActive: {
    backgroundColor: '#0d7a76',
  },
  navLabel: {
    color: '#2f635c',
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#ffffff',
  },
  friendRequestDot: {
    position: 'absolute',
    right: 18,
    top: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d93025',
  },
});
