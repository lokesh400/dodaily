import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
      <View style={screenStyles.friendsCard}>
        <Text style={screenStyles.friendsTitle}>Friends</Text>
        <Text style={screenStyles.friendsSubtitle}>Manage your network and approval requests.</Text>

        <View style={screenStyles.friendTopButtons}>
          <TouchableOpacity style={screenStyles.friendPrimaryButton} onPress={onOpenAddFriendModal}>
            <MaterialCommunityIcons name="account-plus-outline" size={16} color="#ffffff" />
            <Text style={screenStyles.friendPrimaryButtonText}>Add Friend</Text>
          </TouchableOpacity>

          <TouchableOpacity style={screenStyles.friendsSecondaryButton} onPress={onOpenRequestsModal}>
            <MaterialCommunityIcons name="email-outline" size={16} color="#0d7a76" />
            <Text style={screenStyles.friendsSecondaryButtonText}>Requests</Text>
            {incomingFriendRequests.length > 0 ? <View style={screenStyles.inlineRequestDot} /> : null}
          </TouchableOpacity>
        </View>

        <View style={screenStyles.friendsCountRow}>
          <Text style={screenStyles.friendsCountLabel}>All Friends</Text>
          <View style={screenStyles.friendsCountPill}>
            <Text style={screenStyles.friendsCountText}>{friends.length}</Text>
          </View>
        </View>

        {friends.length === 0 ? <Text style={screenStyles.emptyText}>No friends added yet.</Text> : null}
        <ScrollView style={screenStyles.friendsListBox}>
          {friends.map((friend) => (
            <TouchableOpacity key={friend._id} style={screenStyles.friendListRow} onPress={() => onSelectFriend(friend)}>
              <View style={screenStyles.friendAvatarDot} />
              <View style={screenStyles.friendListTextWrap}>
                <Text style={screenStyles.friendPrimary}>{friend.displayName}</Text>
                <Text style={screenStyles.friendSecondary}>@{friend.username}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#6f7f86" />
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
  friendsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4ece3',
    padding: 12,
    marginBottom: 12,
  },
  friendsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#173238',
  },
  friendsSubtitle: {
    fontSize: 12,
    color: '#4f6664',
    marginTop: 4,
    marginBottom: 10,
  },
  friendTopButtons: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  friendPrimaryButton: {
    flex: 1,
    backgroundColor: '#0d7a76',
    borderRadius: 11,
    paddingVertical: 10,
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
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#c7dfd7',
    backgroundColor: '#f3fbf8',
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 10,
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
  inlineRequestDot: {
    position: 'absolute',
    right: 8,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d93025',
  },
  friendsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  friendsCountLabel: {
    color: '#2f635c',
    fontWeight: '700',
  },
  friendsCountPill: {
    backgroundColor: '#e8f8f3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  friendsCountText: {
    color: '#0d7a76',
    fontWeight: '800',
  },
  friendsListBox: {
    maxHeight: 280,
    marginBottom: 4,
  },
  friendListRow: {
    borderWidth: 1,
    borderColor: '#d4ece3',
    backgroundColor: '#f9fdfb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatarDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d6eee7',
    marginRight: 10,
  },
  friendListTextWrap: {
    flex: 1,
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
  emptyText: {
    textAlign: 'center',
    color: '#5f736f',
    marginTop: 20,
    fontSize: 14,
  },
});
