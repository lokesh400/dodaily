import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HapticTouchable from './HapticTouchable';

const TouchableOpacity = HapticTouchable;

const SCREEN_WIDTH = Dimensions.get('window').width;

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

// 🔥 supports past + future
function buildDateStrip(centerDate, before = 14, after = 21) {
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

  // ✅ today's fallback
  const today = toISODate(new Date());
  const activeDate = selectedDate || today;

  // ✅ build dates around active date
  const dates = useMemo(() => buildDateStrip(activeDate, 14, 21), [activeDate]);

  // ✅ auto select today if nothing passed
  useEffect(() => {
    if (!selectedDate && onSelectDate) {
      onSelectDate(today);
    }
  }, []);

  // ✅ center selected date
  useEffect(() => {
    const selectedIndex = dates.findIndex((d) => d === activeDate);
    if (selectedIndex < 0 || !scrollRef.current) return;

    const chipWidth = 60; // based on width + margin
    const centerOffset = SCREEN_WIDTH / 2 - chipWidth / 2;

    setTimeout(() => {
      scrollRef.current.scrollTo({
        x: selectedIndex * chipWidth - centerOffset,
        animated: true,
      });
    }, 0);
  }, [dates, activeDate]);

  return (
    <View style={styles.dateBarCard}>
      <View style={styles.dateBarHeader}>
        <Text style={styles.dateBarEyebrow}>Pick a day</Text>

        <TouchableOpacity style={styles.calendarButton} onPress={onOpenPicker}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={19}
            color="#0f6e68"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateScrollContent}
      >
        {dates.map((dateItem) => {
          const active = dateItem === activeDate;

          return (
            <TouchableOpacity
              key={dateItem}
              style={[styles.dateChip, active && styles.dateChipActive]}
              onPress={() => onSelectDate(dateItem)}
            >
              <Text
                style={[
                  styles.dateChipDay,
                  active && styles.dateChipTextActive,
                ]}
              >
                {dayLabel(dateItem)}
              </Text>

              <Text
                style={[
                  styles.dateChipDate,
                  active && styles.dateChipTextActive,
                ]}
              >
                {dateLabel(dateItem)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dateBarCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#d7e9e3',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: '#163632',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  dateBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  dateBarEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#446763',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  dateScrollContent: {
    paddingRight: 8,
  },

  dateChip: {
    backgroundColor: '#f7fbf9',
    borderWidth: 1,
    borderColor: '#dceae5',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginRight: 2,
    width: 55,
    alignItems: 'center',
  },

  dateChipActive: {
    backgroundColor: '#0d7a76',
    borderColor: '#0d7a76',
    shadowColor: '#0b5c58',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },

  dateChipDay: {
    fontSize: 10,
    color: '#567673',
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  dateChipDate: {
    fontSize: 12,
    color: '#193733',
    fontWeight: '800',
    marginTop: 2,
  },

  dateChipTextActive: {
    color: '#ffffff',
  },

  calendarButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#cfe4dd',
    backgroundColor: '#eef8f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});