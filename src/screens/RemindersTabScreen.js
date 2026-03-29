import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ReminderComposer from '../components/ReminderComposer';

export default function RemindersTabScreen({
  selectedDate,
  handleCreateReminder,
  loading,
  selectedReminders,
  user,
  toggleReminderDone,
  removeReminder,
}) {
  return (
    <View style={screenStyles.domainArea}>
      <ReminderComposer selectedDate={selectedDate} onCreate={handleCreateReminder} loading={loading} />

      <FlatList
        data={selectedReminders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={screenStyles.listContent}
        ListEmptyComponent={<Text style={screenStyles.emptyText}>No reminders for this date yet.</Text>}
        renderItem={({ item }) => (
          <View style={screenStyles.taskRow}>
            <TouchableOpacity style={screenStyles.taskMain} onPress={() => toggleReminderDone(item)}>
              {item.createdBy && String(item.createdBy._id || '') !== String(user.id || user._id || '') ? (
                <Text style={screenStyles.createdByTag}>Created by {item.createdBy.displayName || item.createdBy.username}</Text>
              ) : null}
              <Text style={[screenStyles.taskTitle, item.done && screenStyles.taskDone]}>{item.title}</Text>
              {item.time ? <Text style={screenStyles.taskMeta}>Time: {item.time}</Text> : null}
              {item.notes ? <Text style={screenStyles.taskMeta}>{item.notes}</Text> : null}
              <View style={[screenStyles.statusPill, item.done ? screenStyles.completedChip : screenStyles.pendingChip]}>
                <Text style={screenStyles.statusPillText}>{item.done ? 'Completed' : 'Pending'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={screenStyles.deletePill} onPress={() => removeReminder(item._id)}>
              <Text style={screenStyles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const screenStyles = StyleSheet.create({
  domainArea: {
    flex: 1,
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
  pendingChip: {
    backgroundColor: '#ffedd3',
  },
  completedChip: {
    backgroundColor: '#dff6e8',
  },
  deletePill: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0cfc5',
    backgroundColor: '#fff4ef',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deleteText: {
    color: '#ba4b30',
    fontWeight: '800',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#5f736f',
    marginTop: 20,
    fontSize: 14,
  },
});
