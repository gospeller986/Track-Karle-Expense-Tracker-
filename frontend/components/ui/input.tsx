import { TextInput, View, type TextInputProps, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type InputProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
};

export function Input({ label, hint, error, prefix, suffix, style, ...rest }: InputProps) {
  const { colors, radii, spacing, typography } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label && (
        <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
          {label}
        </ThemedText>
      )}

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.expense : colors.border,
            borderRadius: radii.lg,
            borderWidth: 1,
            paddingHorizontal: spacing.lg,
            minHeight: 52,
          },
        ]}
      >
        {prefix && <View style={{ marginRight: spacing.sm }}>{prefix}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              flex: 1,
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          {...rest}
        />

        {suffix && <View style={{ marginLeft: spacing.sm }}>{suffix}</View>}
      </View>

      {(hint || error) && (
        <ThemedText
          variant="caption"
          color={error ? colors.expense : colors.textTertiary}
          style={{ marginTop: spacing.xs }}
        >
          {error ?? hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 0 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    paddingVertical: 14,
  },
});
