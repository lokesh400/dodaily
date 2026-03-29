import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftISODate(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function buildDateStrip(centerDate, before = 0, after = 21) {
  const days = [];
  for (let i = -before; i <= after; i += 1) {
    days.push(shiftISODate(centerDate, i));
  }
  return days;
}

function dayLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function dateLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function DateBar({ selectedDate, onSelectDate, onOpenPicker }) {
  const scrollRef = useRef(null);
  const dates = useMemo(() => buildDateStrip(selectedDate), [selectedDate]);

  useEffect(() => {
    const selectedIndex = dates.findIndex((dateItem) => dateItem === selectedDate);
    if (selectedIndex < 0 || !scrollRef.current) {
      return;
    }

    const CHIP_WITH_GAP = 78;
    scrollRef.current.scrollTo({
      x: selectedIndex * CHIP_WITH_GAP,
      animated: true,
    });
  }, [dates, selectedDate]);

  return (
    <View style={styles.dateBarWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateScrollContent}
      >
        {dates.map((dateItem) => {
          const active = dateItem === selectedDate;
          return (
            <TouchableOpacity
              key={dateItem}
              style={[styles.dateChip, active && styles.dateChipActive]}
              onPress={() => onSelectDate(dateItem)}
            >
              <Text style={[styles.dateChipDay, active && styles.dateChipTextActive]}>{dayLabel(dateItem)}</Text>
              <Text style={[styles.dateChipDate, active && styles.dateChipTextActive]}>{dateLabel(dateItem)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.calendarButton} onPress={onOpenPicker}>
        <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#0f6e68" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dateBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateScrollContent: {
    paddingRight: 8,
  },
  dateChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4ece3',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    width: 70,
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: '#0d7a76',
    borderColor: '#0d7a76',
  },
  dateChipDay: {
    fontSize: 11,
    color: '#446360',
    fontWeight: '700',
  },
  dateChipDate: {
    fontSize: 13,
    color: '#193733',
    fontWeight: '700',
  },
  dateChipTextActive: {
    color: '#ffffff',
  },
  calendarButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7e0d9',
    backgroundColor: '#eaf8f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
