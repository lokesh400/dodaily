import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import HapticTouchable from '../components/HapticTouchable';

const TouchableOpacity = HapticTouchable;

function getInitial(friend) {
  const source = friend.displayName || friend.username || 'F';
  return source.trim().charAt(0).toUpperCase() || 'F';
}

export default function FriendsTabScreen({
  friends,
  incomingFriendRequests,
  onOpenAddFriendModal,
  onOpenRequestsModal,
  onOpenQuickAddModal,
  onSelectFriend,
}) {
  return (
    <View style={screenStyles.domainArea}>
      <View style={screenStyles.heroCard}>
        <View style={screenStyles.heroTopRow}>
          <View>
            <Text style={screenStyles.heroEyebrow}>Social Hub</Text>
            <Text style={screenStyles.heroTitle}>Friends</Text>
            <Text style={screenStyles.heroSubtitle}>
              Keep your circle close and share planners and reminders with people you trust.
            </Text>
          </View>
          <View style={screenStyles.friendCountBadge}>
            <Text style={screenStyles.friendCountValue}>{friends.length}</Text>
            <Text style={screenStyles.friendCountLabel}>Friends</Text>
          </View>
        </View>

        <View style={screenStyles.friendTopButtons}>
          <TouchableOpacity style={screenStyles.friendPrimaryButton} onPress={onOpenAddFriendModal}>
            <MaterialCommunityIcons name="account-plus-outline" size={16} color="#ffffff" />
            <Text style={screenStyles.friendPrimaryButtonText}>Add Friend</Text>
          </TouchableOpacity>

          <TouchableOpacity style={screenStyles.friendsSecondaryButton} onPress={onOpenRequestsModal}>
            <MaterialCommunityIcons name="email-outline" size={16} color="#0d7a76" />
            <Text style={screenStyles.friendsSecondaryButtonText}>Requests</Text>
            {incomingFriendRequests.length > 0 ? (
              <View style={screenStyles.requestPill}>
                <Text style={screenStyles.requestPillText}>{incomingFriendRequests.length}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <View style={screenStyles.listCard}>
        <View style={screenStyles.listHeader}>
          <Text style={screenStyles.listTitle}>Your People</Text>
          <Text style={screenStyles.listSubtitle}>
            Tap a friend to see sent and received planners or reminders.
          </Text>
        </View>

        {friends.length === 0 ? (
          <View style={screenStyles.emptyStateCard}>
            <MaterialCommunityIcons name="account-group-outline" size={30} color="#5c7e79" />
            <Text style={screenStyles.emptyStateTitle}>No friends added yet</Text>
            <Text style={screenStyles.emptyStateText}>
              Send a friend request to start sharing plans together.
            </Text>
          </View>
        ) : null}

        <ScrollView style={screenStyles.friendsListBox} showsVerticalScrollIndicator={false}>
          {friends.map((friend) => (
            <TouchableOpacity key={friend._id} style={screenStyles.friendListRow} onPress={() => onSelectFriend(friend)}>
              <View style={screenStyles.friendAvatarCircle}>
                <Text style={screenStyles.friendAvatarText}>{getInitial(friend)}</Text>
              </View>
              <View style={screenStyles.friendListTextWrap}>
                <Text style={screenStyles.friendPrimary}>{friend.displayName}</Text>
                <Text style={screenStyles.friendSecondary}>@{friend.username}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#6f7f86" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={screenStyles.addFloatingButton} onPress={onOpenQuickAddModal}>
        <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  domainArea: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d7e9e3',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#163632',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroEyebrow: {
    color: '#53716d',
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#173238',
    marginTop: 4,
  },
  heroSubtitle: {
    color: '#53716d',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 230,
  },
  friendCountBadge: {
    backgroundColor: '#ebfaf5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 88,
  },
  friendCountValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0d7a76',
  },
  friendCountLabel: {
    color: '#456360',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  friendTopButtons: {
    flexDirection: 'row',
  },
  friendPrimaryButton: {
    flex: 1,
    backgroundColor: '#0d7a76',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 8,
  },
  friendPrimaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    marginLeft: 6,
  },
  friendsSecondaryButton: {
    minWidth: 132,
    borderWidth: 1,
    borderColor: '#d4e6df',
    backgroundColor: '#f6fbf9',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  friendsSecondaryButtonText: {
    color: '#0d7a76',
    fontWeight: '800',
    marginLeft: 6,
  },
  requestPill: {
    marginLeft: 8,
    minWidth: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#d93025',
    alignItems: 'center',
  },
  requestPillText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
  },
  listCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d7e9e3',
    padding: 14,
  },
  listHeader: {
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173238',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#567673',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyStateCard: {
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#f8fcfa',
    borderWidth: 1,
    borderColor: '#e0ece7',
    marginTop: 4,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#173238',
    marginTop: 10,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#5f736f',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  friendsListBox: {
    flex: 1,
    marginBottom: 4,
  },
  friendListRow: {
    borderWidth: 1,
    borderColor: '#dbeae5',
    backgroundColor: '#fbfdfc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#def3eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: '#0d7a76',
    fontWeight: '800',
    fontSize: 16,
  },
  friendListTextWrap: {
    flex: 1,
  },
  friendPrimary: {
    color: '#173238',
    fontWeight: '800',
    fontSize: 14,
  },
  friendSecondary: {
    color: '#5d7571',
    marginTop: 2,
    fontSize: 12,
  },
  addFloatingButton: {
    position: 'absolute',
    right: 6,
    bottom: 18,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0d7a76',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d4f4a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
});
