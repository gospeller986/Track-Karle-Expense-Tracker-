import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

// ─── Helpers ──────────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Local-time ISO string — avoids UTC-offset bugs */
function toISO(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Build a calendar grid for the current month.
 * Cells before the 1st or after today are null (invisible).
 */
function buildMonthGrid(): (Date | null)[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year  = today.getFullYear();
  const month = today.getMonth();

  const firstDay  = new Date(year, month, 1);
  const startDow  = firstDay.getDay();   // 0 = Sun … 6 = Sat
  const lastDayNum = today.getDate();     // cap grid at today

  const totalSlots = startDow + lastDayNum;
  const numRows    = Math.ceil(totalSlots / 7);

  const rows: (Date | null)[][] = [];
  for (let row = 0; row < numRows; row++) {
    const week: (Date | null)[] = [];
    for (let col = 0; col < 7; col++) {
      const slot   = row * 7 + col;
      const dayNum = slot - startDow + 1;      // 1-based day of month
      if (dayNum < 1 || dayNum > lastDayNum) {
        week.push(null);
      } else {
        week.push(new Date(year, month, dayNum));
      }
    }
    rows.push(week);
  }
  return rows;
}

// ─── Animated streak number ────────────────────────────────────

function StreakCount({ count, animated }: { count: number; animated: boolean }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.45, useNativeDriver: true, speed: 40, bounciness: 14 }),
        Animated.timing(glow,  { toValue: 1, duration: 200, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
        Animated.timing(glow,  { toValue: 0, duration: 400, useNativeDriver: false }),
      ]),
    ]).start();
  }, [animated, scale, glow]);

  const glowBg = glow.interpolate({
    inputRange:  [0, 1],
    outputRange: ['transparent', colors.accentMuted],
  });

  return (
    <Animated.View style={[styles.streakCountWrap, { backgroundColor: glowBg, transform: [{ scale }] }]}>
      <ThemedText variant="h2" color={colors.accent} bold style={styles.streakNum}>
        {count}
      </ThemedText>
      <ThemedText variant="bodySm" color={colors.accent} style={{ marginLeft: 4, marginBottom: 3 }}>
        {count === 1 ? 'Day' : 'Days'}
      </ThemedText>
    </Animated.View>
  );
}

// ─── Single heatmap cell ───────────────────────────────────────

function Cell({ date, active, isToday }: { date: Date | null; active: boolean; isToday: boolean }) {
  const { colors, radii } = useTheme();
  const scale = useRef(new Animated.Value(date ? (active ? 1 : 0.85) : 0)).current;

  useEffect(() => {
    if (!date) return;
    Animated.spring(scale, {
      toValue: active ? 1 : 0.85,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [active, date, scale]);

  // Empty slot — invisible placeholder to keep grid alignment
  if (!date) {
    return <View style={styles.cellWrap} />;
  }

  return (
    <View style={styles.cellWrap}>
      <Animated.View
        style={[
          styles.cell,
          { borderRadius: radii.md, transform: [{ scale }] },
          // Active day — solid filled background
          active  && { backgroundColor: colors.accent },
          // Inactive past day — surface with subtle border
          !active && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          // Today glow (active)
          isToday && active  && styles.todayGlow,
          // Today ring (not yet logged)
          isToday && !active && { borderColor: colors.accent, borderWidth: 2 },
        ]}
      />
    </View>
  );
}

// ─── StreakCard ────────────────────────────────────────────────

interface Props {
  activeDays: string[];
  currentStreak: number;
  longestStreak: number;
  streakJustIncremented: boolean;
}

export function StreakCard({ activeDays, currentStreak, longestStreak, streakJustIncremented }: Props) {
  const { colors, spacing, radii } = useTheme();

  const activeSet  = new Set(activeDays);
  const grid       = buildMonthGrid();
  const today      = new Date();
  const todayISO   = toISO(today);
  const monthLabel = `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

  const fireScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!streakJustIncremented) return;
    Animated.sequence([
      Animated.spring(fireScale, { toValue: 1.6, useNativeDriver: true, speed: 30, bounciness: 18 }),
      Animated.spring(fireScale, { toValue: 1,   useNativeDriver: true, speed: 15 }),
    ]).start();
  }, [streakJustIncremented, fireScale]);

  const todayActive = activeSet.has(todayISO);
  const message = currentStreak === 0
    ? 'Start tracking to build your streak!'
    : todayActive
      ? `${currentStreak} day streak — keep it up! 🎯`
      : 'Log an expense today to keep your streak alive!';

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii['2xl'] }]}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Animated.View style={{ transform: [{ scale: fireScale }] }}>
              <Ionicons name="flame" size={22} color={colors.accent} />
            </Animated.View>
            <ThemedText variant="h4" bold> Daily Streak</ThemedText>
          </View>
          <StreakCount count={currentStreak} animated={streakJustIncremented} />
        </View>

        {/* Month label */}
        <ThemedText variant="caption" color={colors.textSecondary} style={styles.monthLabel}>
          {monthLabel}
        </ThemedText>

        {/* Day-of-week column headers */}
        <View style={styles.row}>
          {DAY_LABELS.map((d, i) => (
            <View key={i} style={styles.cellWrap}>
              <ThemedText variant="caption" color={colors.textTertiary} style={styles.dayLabel}>{d}</ThemedText>
            </View>
          ))}
        </View>

        {/* Calendar grid — current month only, no future cells */}
        {grid.map((week, wi) => (
          <View key={wi} style={styles.row}>
            {week.map((date, di) => (
              <Cell
                key={di}
                date={date}
                active={date !== null && activeSet.has(toISO(date))}
                isToday={date !== null && toISO(date) === todayISO}
              />
            ))}
          </View>
        ))}

        {/* Best streak */}
        {longestStreak > 0 && (
          <View style={styles.footer}>
            <ThemedText variant="caption" color={colors.textTertiary}>
              Best: <ThemedText variant="caption" color={colors.accent} bold>{longestStreak} days</ThemedText>
            </ThemedText>
          </View>
        )}

        {/* Nudge message */}
        <ThemedText variant="caption" color={colors.textSecondary} style={styles.message}>
          {message}
        </ThemedText>

      </View>
    </View>
  );
}

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  card:            { padding: 20, gap: 8, borderWidth: 1 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft:      { flexDirection: 'row', alignItems: 'center' },
  streakCountWrap: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  streakNum:       { lineHeight: 36 },
  monthLabel:      { marginBottom: 2 },
  row:             { flexDirection: 'row' },
  cellWrap:        { flex: 1, alignItems: 'center', paddingVertical: 3 },
  cell:            { width: CELL_SIZE, height: CELL_SIZE },
  dayLabel:        { textAlign: 'center' },
  todayGlow:       {
    shadowColor:   '#C9F31D',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius:  10,
    elevation:     8,
  },
  footer:          { alignItems: 'center', marginTop: 2 },
  message:         { textAlign: 'center', paddingHorizontal: 8 },
});
