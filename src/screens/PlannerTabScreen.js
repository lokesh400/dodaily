import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PlannerTabScreen({
  statusCounts,
  roadmapTasks,
  unmanagedTasks,
  user,
  normalizeTaskStatus,
  cycleTaskStatus,
  onOpenTaskActions,
  onOpenCreateTask,
}) {
  return (
    <View style={screenStyles.domainArea}>
      <View style={screenStyles.summaryRow}>
        <View style={[screenStyles.summaryChip, screenStyles.pendingChip]}>
          <Text style={screenStyles.summaryLabel}>Pending {statusCounts.pending}</Text>
        </View>
        <View style={[screenStyles.summaryChip, screenStyles.partialChip]}>
          <Text style={screenStyles.summaryLabel}>Partial {statusCounts.partial}</Text>
        </View>
        <View style={[screenStyles.summaryChip, screenStyles.completedChip]}>
          <Text style={screenStyles.summaryLabel}>Completed {statusCounts.completed}</Text>
        </View>
      </View>

      <Text style={screenStyles.sectionHeading}>Roadmap Tasks (Time Divided)</Text>
      <FlatList
        data={roadmapTasks}
        keyExtractor={(item) => item._id}
        contentContainerStyle={screenStyles.listContent}
        ListEmptyComponent={<Text style={screenStyles.emptyText}>No roadmap tasks with time for this date.</Text>}
        renderItem={({ item }) => {
          const status = normalizeTaskStatus(item);
          const createdByName =
            item.createdBy && String(item.createdBy._id || '') !== String(user.id || user._id || '')
              ? item.createdBy.displayName || item.createdBy.username
              : '';

          return (
            <View style={screenStyles.taskRow}>
              <View style={screenStyles.taskMain}>
                <View style={screenStyles.roadmapTopRow}>
                  <Text style={screenStyles.taskTitle}>{item.title}</Text>
                  <Text style={screenStyles.taskTimeBadge}>{item.time}</Text>
                </View>
                {item.notes ? <Text style={screenStyles.taskMeta}>{item.notes}</Text> : null}
                {createdByName ? <Text style={screenStyles.createdByTag}>Created by {createdByName}</Text> : null}
                <TouchableOpacity
                  style={[
                    screenStyles.statusPill,
                    status === 'completed'
                      ? screenStyles.completedChip
                      : status === 'partial'
                        ? screenStyles.partialChip
                        : screenStyles.pendingChip,
                  ]}
                  onPress={() => cycleTaskStatus(item)}
                >
                  <Text style={screenStyles.statusPillText}>Status: {status}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={screenStyles.actionsIconButton} onPress={() => onOpenTaskActions(item)}>
                <MaterialCommunityIcons name="dots-vertical" size={18} color="#2f635c" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <Text style={screenStyles.sectionHeading}>Unmanaged Tasks (No Time)</Text>
      <FlatList
        data={unmanagedTasks}
        keyExtractor={(item) => item._id}
        contentContainerStyle={screenStyles.listContent}
        ListEmptyComponent={<Text style={screenStyles.emptyText}>No unmanaged tasks for this date.</Text>}
        renderItem={({ item }) => {
          const status = normalizeTaskStatus(item);
          const createdByName =
            item.createdBy && String(item.createdBy._id || '') !== String(user.id || user._id || '')
              ? item.createdBy.displayName || item.createdBy.username
              : '';

          return (
            <View style={screenStyles.taskRow}>
              <View style={screenStyles.taskMain}>
                <Text style={screenStyles.taskTitle}>{item.title}</Text>
                {item.notes ? <Text style={screenStyles.taskMeta}>{item.notes}</Text> : null}
                {createdByName ? <Text style={screenStyles.createdByTag}>Created by {createdByName}</Text> : null}
                <TouchableOpacity
                  style={[
                    screenStyles.statusPill,
                    status === 'completed'
                      ? screenStyles.completedChip
                      : status === 'partial'
                        ? screenStyles.partialChip
                        : screenStyles.pendingChip,
                  ]}
                  onPress={() => cycleTaskStatus(item)}
                >
                  <Text style={screenStyles.statusPillText}>Status: {status}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={screenStyles.actionsIconButton} onPress={() => onOpenTaskActions(item)}>
                <MaterialCommunityIcons name="dots-vertical" size={18} color="#2f635c" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <TouchableOpacity style={screenStyles.addFloatingButton} onPress={onOpenCreateTask}>
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
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18423f',
    marginBottom: 8,
    marginTop: 2,
  },
  pendingChip: {
    backgroundColor: '#ffedd3',
  },
  partialChip: {
    backgroundColor: '#dff3ff',
  },
  completedChip: {
    backgroundColor: '#dff6e8',
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
  roadmapTopRow: {
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
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173238',
  },
  taskMeta: {
    color: '#536765',
    marginTop: 3,
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
