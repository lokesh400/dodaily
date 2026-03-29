import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ReminderComposer({ selectedDate, onCreate, loading }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const submit = async () => {
    if (!title.trim()) {
      return;
    }

    await onCreate({ title: title.trim(), time: time.trim(), notes: notes.trim(), date: selectedDate });
    setTitle('');
    setTime('');
    setNotes('');
  };

  return (
    <View style={styles.composerCard}>
      <Text style={styles.composerTitle}>Add Reminder</Text>
      <Text style={styles.composerHint}>Date: {selectedDate}</Text>
      <TextInput
        style={styles.input}
        placeholder="Reminder title"
        placeholderTextColor="#6f7f86"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Time (e.g. 09:30 or 09:30 AM)"
        placeholderTextColor="#6f7f86"
        value={time}
        onChangeText={setTime}
      />
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Notes (optional)"
        placeholderTextColor="#6f7f86"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={submit}>
        <Text style={styles.primaryButtonLabel}>{loading ? 'Saving...' : 'Add Reminder'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  composerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d4ece3',
  },
  composerTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    color: '#173238',
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
  primaryButton: {
    backgroundColor: '#0d7a76',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
