import { View, TouchableOpacity, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Props = {
  year: number;
  month: number; // 1–12
  onChange: (year: number, month: number) => void;
};

export function MonthPicker({ year, month, onChange }: Props) {
  const { colors, spacing, radii } = useTheme();
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function goToPrev() {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  }

  function goToNext() {
    if (isCurrentMonth) return;
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  }

  return (
    <View style={[styles.row, { paddingHorizontal: spacing.xl }]}>
      <TouchableOpacity
        onPress={goToPrev}
        style={[styles.btn, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.md,
        }]}
      >
        <ThemedText variant="h4" color={colors.textPrimary}>‹</ThemedText>
      </TouchableOpacity>

      <ThemedText variant="bodySm" semibold style={styles.label} color={colors.textPrimary}>
        {FULL_MONTHS[month - 1]} {year}
      </ThemedText>

      <TouchableOpacity
        onPress={goToNext}
        disabled={isCurrentMonth}
        style={[styles.btn, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.md,
          opacity: isCurrentMonth ? 0.35 : 1,
        }]}
      >
        <ThemedText variant="h4" color={colors.textPrimary}>›</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center' },
  btn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, textAlign: 'center' },
});
