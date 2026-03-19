import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type BadgeVariant = 'accent' | 'secondary' | 'expense' | 'income' | 'warning' | 'neutral';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
};

export function Badge({ label, variant = 'neutral', size = 'md' }: BadgeProps) {
  const { colors, radii, spacing } = useTheme();

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    accent:    { bg: colors.accentMuted,    text: colors.accent    },
    secondary: { bg: colors.secondaryMuted, text: colors.secondary },
    expense:   { bg: colors.expenseMuted,   text: colors.expense   },
    income:    { bg: colors.incomeMuted,    text: colors.income    },
    warning:   { bg: colors.warningMuted,   text: colors.warning   },
    neutral:   { bg: colors.surfaceElevated, text: colors.textSecondary },
  };

  const v = variantMap[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderRadius: radii.full,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
          paddingVertical: isSmall ? 2 : spacing.xs,
        },
      ]}
    >
      <ThemedText variant={isSmall ? 'caption' : 'label'} color={v.text}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
  },
});
