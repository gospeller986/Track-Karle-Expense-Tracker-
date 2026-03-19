import { Text, type TextProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type TextVariant =
  | 'display'       // 48px bold  — big hero numbers
  | 'h1'            // 36px bold
  | 'h2'            // 30px bold
  | 'h3'            // 24px semibold
  | 'h4'            // 20px semibold
  | 'bodyLg'        // 17px regular
  | 'body'          // 15px regular
  | 'bodySm'        // 13px regular
  | 'label'         // 13px semibold  — tags, labels
  | 'caption'       // 11px regular
  | 'mono';         // 15px monospace — amounts

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  semibold?: boolean;
  bold?: boolean;
};

export function ThemedText({
  style,
  variant = 'body',
  color,
  semibold,
  bold,
  ...rest
}: ThemedTextProps) {
  const { colors, typography } = useTheme();

  const variantStyles: Record<TextVariant, object> = {
    display: { fontSize: typography.sizes['5xl'], fontWeight: typography.weights.black,    letterSpacing: typography.tracking.tight,  lineHeight: typography.sizes['5xl'] * typography.lineHeights.tight },
    h1:      { fontSize: typography.sizes['4xl'], fontWeight: typography.weights.bold,     letterSpacing: typography.tracking.tight,  lineHeight: typography.sizes['4xl'] * typography.lineHeights.tight },
    h2:      { fontSize: typography.sizes['3xl'], fontWeight: typography.weights.bold,     letterSpacing: typography.tracking.tight,  lineHeight: typography.sizes['3xl'] * typography.lineHeights.snug  },
    h3:      { fontSize: typography.sizes['2xl'], fontWeight: typography.weights.semibold, lineHeight: typography.sizes['2xl'] * typography.lineHeights.snug  },
    h4:      { fontSize: typography.sizes.xl,     fontWeight: typography.weights.semibold, lineHeight: typography.sizes.xl  * typography.lineHeights.snug  },
    bodyLg:  { fontSize: typography.sizes.lg,     fontWeight: typography.weights.regular,  lineHeight: typography.sizes.lg  * typography.lineHeights.normal },
    body:    { fontSize: typography.sizes.md,     fontWeight: typography.weights.regular,  lineHeight: typography.sizes.md  * typography.lineHeights.normal },
    bodySm:  { fontSize: typography.sizes.sm,     fontWeight: typography.weights.regular,  lineHeight: typography.sizes.sm  * typography.lineHeights.normal },
    label:   { fontSize: typography.sizes.sm,     fontWeight: typography.weights.semibold, letterSpacing: typography.tracking.wide,   lineHeight: typography.sizes.sm  * typography.lineHeights.normal },
    caption: { fontSize: typography.sizes.xs,     fontWeight: typography.weights.regular,  lineHeight: typography.sizes.xs  * typography.lineHeights.normal },
    mono:    { fontSize: typography.sizes.md,     fontWeight: typography.weights.semibold, fontVariant: ['tabular-nums'] },
  };

  const weightOverride = bold
    ? { fontWeight: typography.weights.bold }
    : semibold
    ? { fontWeight: typography.weights.semibold }
    : {};

  return (
    <Text
      style={[
        { color: color ?? colors.textPrimary },
        variantStyles[variant],
        weightOverride,
        style,
      ]}
      {...rest}
    />
  );
}
