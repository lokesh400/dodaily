import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RemindersTabScreen({
  reminderCounts,
  sortedReminders,
  user,
  onToggleReminderDone,
  onOpenReminderActions,
  onOpenCreateReminder,
}) {
  return (
    <View style={screenStyles.domainArea}>
      <View style={screenStyles.summaryRow}>
        <View style={[screenStyles.summaryChip, screenStyles.pendingChip]}>
          <Text style={screenStyles.summaryLabel}>Pending {reminderCounts.pending}</Text>
        </View>
        <View style={[screenStyles.summaryChip, screenStyles.completedChip]}>
          <Text style={screenStyles.summaryLabel}>Completed {reminderCounts.completed}</Text>
        </View>
        <View style={[screenStyles.summaryChip, screenStyles.upcomingChip]}>
          <Text style={screenStyles.summaryLabel}>Upcoming {reminderCounts.upcoming}</Text>
        </View>
      </View>

      <Text style={screenStyles.sectionHeading}>Scheduled Reminders</Text>
      <FlatList
        data={sortedReminders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={screenStyles.listContent}
        ListEmptyComponent={<Text style={screenStyles.emptyText}>No reminders for this date yet.</Text>}
        renderItem={({ item }) => (
          <View style={screenStyles.taskRow}>
            <View style={screenStyles.taskMain}>
              <View style={screenStyles.rowTop}>
                <Text style={[screenStyles.taskTitle, item.done && screenStyles.taskDone]}>{item.title}</Text>
                <Text style={screenStyles.taskTimeBadge}>{item.time || 'Time missing'}</Text>
              </View>
              {item.notes ? <Text style={screenStyles.taskMeta}>{item.notes}</Text> : null}
              {item.createdBy && String(item.createdBy._id || '') !== String(user.id || user._id || '') ? (
                <Text style={screenStyles.createdByTag}>Created by {item.createdBy.displayName || item.createdBy.username}</Text>
              ) : null}
              <TouchableOpacity
                style={[screenStyles.statusPill, item.done ? screenStyles.completedChip : screenStyles.pendingChip]}
                onPress={() => onToggleReminderDone(item)}
              >
                <Text style={screenStyles.statusPillText}>Status: {item.done ? 'completed' : 'pending'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={screenStyles.actionsIconButton} onPress={() => onOpenReminderActions(item)}>
              <MaterialCommunityIcons name="dots-vertical" size={18} color="#2f635c" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={screenStyles.addFloatingButton} onPress={onOpenCreateReminder}>
        <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  domainArea: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  summaryLabel: {
    color: '#18423f',
    fontWeight: '700',
    fontSize: 12,
  },
  pendingChip: {
    backgroundColor: '#ffedd3',
  },
  completedChip: {
    backgroundColor: '#dff6e8',
  },
  upcomingChip: {
    backgroundColor: '#dff3ff',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18423f',
    marginBottom: 8,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 10,
  },
  taskRow: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d4ece3',
  },
  taskMain: {
    flex: 1,
    marginRight: 10,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTimeBadge: {
    color: '#0d7a76',
    backgroundColor: '#e8f8f3',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: '700',
    fontSize: 12,
  },
  createdByTag: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#eef8ff',
    color: '#2c5d8a',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: '700',
    fontSize: 11,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173238',
  },
  taskDone: {
    textDecorationLine: 'line-through',
    color: '#6d8280',
  },
  taskMeta: {
    color: '#536765',
    marginTop: 3,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  statusPillText: {
    color: '#194341',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  actionsIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4ece3',
    backgroundColor: '#f5fcfa',
    alignItems: 'center',
    justifyContent: 'center',
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
