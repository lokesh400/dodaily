import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HapticTouchable from '../components/HapticTouchable';

const TouchableOpacity = HapticTouchable;

export default function PlannerTabScreen({
  statusCounts,
  incomingPlannerAssignments,
  roadmapTasks,
  unmanagedTasks,
  user,
  normalizeTaskStatus,
  cycleTaskStatus,
  onAnswerIncomingPlanner,
  onOpenTaskActions,
  onOpenCreateTask,
}) {
  const hasAnyTasks =
    incomingPlannerAssignments.length > 0 ||
    roadmapTasks.length > 0 ||
    unmanagedTasks.length > 0;

  return (
    <View style={screenStyles.domainArea}>
      <View style={screenStyles.summaryRow}>
        <View style={[screenStyles.summaryCard, screenStyles.pendingCard]}>
          <Text style={screenStyles.summaryCount}>{statusCounts.pending}</Text>
          <Text style={screenStyles.summaryLabel}>Pending</Text>
        </View>
        <View style={[screenStyles.summaryCard, screenStyles.partialCard]}>
          <Text style={screenStyles.summaryCount}>{statusCounts.partial}</Text>
          <Text style={screenStyles.summaryLabel}>Partial</Text>
        </View>
        <View style={[screenStyles.summaryCard, screenStyles.completedCard]}>
          <Text style={screenStyles.summaryCount}>{statusCounts.completed}</Text>
          <Text style={screenStyles.summaryLabel}>Completed</Text>
        </View>
      </View>

      {incomingPlannerAssignments.length > 0 ? (
        <>
          <Text style={screenStyles.sectionHeading}>Incoming Planner Requests</Text>
          <View style={screenStyles.approvalList}>
            {incomingPlannerAssignments.map((item) => (
              <View key={item._id} style={screenStyles.approvalCard}>
                <View style={screenStyles.approvalHeaderRow}>
                  <Text style={screenStyles.approvalTitle}>{item.title}</Text>
                  <View style={screenStyles.approvalBadge}>
                    <Text style={screenStyles.approvalBadgeText}>Needs Approval</Text>
                  </View>
                </View>
                <Text style={screenStyles.approvalMeta}>
                  From {item.fromUser?.displayName || item.fromUser?.username || 'Friend'}
                </Text>
                <Text style={screenStyles.approvalMeta}>
                  Date: {item.date}
                  {item.time ? ` | Time: ${item.time}` : ''}
                </Text>
                {item.notes ? <Text style={screenStyles.approvalNotes}>{item.notes}</Text> : null}
                <View style={screenStyles.approvalActions}>
                  <TouchableOpacity
                    style={screenStyles.approvalApproveButton}
                    onPress={() => onAnswerIncomingPlanner(item._id, 'approve')}
                  >
                    <Text style={screenStyles.approvalApproveText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={screenStyles.approvalRejectButton}
                    onPress={() => onAnswerIncomingPlanner(item._id, 'reject')}
                  >
                    <Text style={screenStyles.approvalRejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {roadmapTasks.length > 0 ? (
        <>
          <Text style={screenStyles.sectionHeading}>Roadmap Tasks</Text>
          <FlatList
            data={roadmapTasks}
            keyExtractor={(item) => item._id}
            contentContainerStyle={screenStyles.listContent}
            scrollEnabled={false}
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
                          ? screenStyles.completedCard
                          : status === 'partial'
                            ? screenStyles.partialCard
                            : screenStyles.pendingCard,
                      ]}
                      onPress={() => cycleTaskStatus(item)}
                    >
                      <Text style={screenStyles.statusPillText}>Status: {status}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={screenStyles.actionsIconButton} onPress={() => onOpenTaskActions(item)}>
                    <MaterialCommunityIcons name="dots-horizontal" size={18} color="#2f635c" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </>
      ) : null}

      {unmanagedTasks.length > 0 ? (
        <>
          <Text style={screenStyles.sectionHeading}>Unmanaged Tasks</Text>
          <FlatList
            data={unmanagedTasks}
            keyExtractor={(item) => item._id}
            contentContainerStyle={screenStyles.listContent}
            scrollEnabled={false}
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
                          ? screenStyles.completedCard
                          : status === 'partial'
                            ? screenStyles.partialCard
                            : screenStyles.pendingCard,
                      ]}
                      onPress={() => cycleTaskStatus(item)}
                    >
                      <Text style={screenStyles.statusPillText}>Status: {status}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={screenStyles.actionsIconButton} onPress={() => onOpenTaskActions(item)}>
                    <MaterialCommunityIcons name="dots-horizontal" size={18} color="#2f635c" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </>
      ) : null}

      {!hasAnyTasks ? (
        <View style={screenStyles.emptyStateCard}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={30} color="#5c7e79" />
          <Text style={screenStyles.emptyStateTitle}>Nothing planned yet</Text>
          <Text style={screenStyles.emptyStateText}>
            Add a planner task for this date to start shaping the day.
          </Text>
        </View>
      ) : null}

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
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  pendingCard: {
    backgroundColor: '#fff1d8',
    borderColor: '#f3d3a2',
  },
  partialCard: {
    backgroundColor: '#e3f2ff',
    borderColor: '#bddcf8',
  },
  completedCard: {
    backgroundColor: '#def6e9',
    borderColor: '#b8dfca',
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163432',
  },
  summaryLabel: {
    color: '#456360',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#183634',
    marginBottom: 8,
    marginTop: 4,
  },
  approvalList: {
    marginBottom: 6,
  },
  approvalCard: {
    backgroundColor: '#fff3f1',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1b6af',
  },
  approvalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  approvalTitle: {
    flex: 1,
    color: '#842029',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
  },
  approvalBadge: {
    backgroundColor: '#d93025',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  approvalBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  approvalMeta: {
    color: '#8a4f4a',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  approvalNotes: {
    color: '#744a45',
    marginTop: 8,
    lineHeight: 18,
  },
  approvalActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  approvalApproveButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#0d7a76',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  approvalApproveText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  approvalRejectButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e09d98',
  },
  approvalRejectText: {
    color: '#b33f35',
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 4,
  },
  taskRow: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d6e9e2',
    shadowColor: '#123a35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: '#ebfaf5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '800',
    fontSize: 12,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#173238',
  },
  taskMeta: {
    color: '#536765',
    marginTop: 4,
    lineHeight: 18,
  },
  createdByTag: {
    marginTop: 7,
    alignSelf: 'flex-start',
    backgroundColor: '#eef7ff',
    color: '#2c5d8a',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '700',
    fontSize: 11,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusPillText: {
    color: '#194341',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  actionsIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9ebe5',
    backgroundColor: '#f6fbfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCard: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6e9e2',
    marginTop: 10,
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
