import { View, TouchableOpacity, type ViewProps, type TouchableOpacityProps, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & {
  elevated?: boolean;  // use surfaceElevated bg
  onPress?: TouchableOpacityProps['onPress'];
  padded?: boolean;
  noBorder?: boolean;
};

export function Card({ style, elevated, onPress, padded = true, noBorder, children, ...rest }: CardProps) {
  const { colors, radii, spacing, shadows } = useTheme();

  const cardStyle = [
    styles.base,
    {
      backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
      borderRadius: radii.xl,
      borderColor: noBorder ? 'transparent' : colors.border,
      borderWidth: noBorder ? 0 : 1,
      padding: padded ? spacing.lg : 0,
      ...shadows.sm,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={cardStyle} {...(rest as any)}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
