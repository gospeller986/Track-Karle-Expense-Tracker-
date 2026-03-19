import {
  TouchableOpacity,
  ActivityIndicator,
  type TouchableOpacityProps,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = TouchableOpacityProps & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const { colors, radii, spacing } = useTheme();

  const variantStyles = {
    primary:   { bg: colors.accent,     text: colors.textOnAccent, border: 'transparent' as const },
    secondary: { bg: colors.surface,    text: colors.textPrimary,  border: colors.border          },
    ghost:     { bg: 'transparent',     text: colors.textPrimary,  border: 'transparent' as const },
    danger:    { bg: colors.expenseMuted, text: colors.expense,    border: colors.expense         },
  };

  const sizeStyles = {
    sm: { height: 36, px: spacing.md,  radius: radii.md,  textVariant: 'label'  as const },
    md: { height: 48, px: spacing.xl,  radius: radii.lg,  textVariant: 'bodyLg' as const },
    lg: { height: 56, px: spacing['2xl'], radius: radii.xl, textVariant: 'bodyLg' as const },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.px,
          borderRadius: s.radius,
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'secondary' || variant === 'danger' ? 1 : 0,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <View style={styles.inner}>
          {icon && iconPosition === 'left' && <View style={{ marginRight: 6 }}>{icon}</View>}
          <ThemedText variant={s.textVariant} color={v.text} bold>
            {label}
          </ThemedText>
          {icon && iconPosition === 'right' && <View style={{ marginLeft: 6 }}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
