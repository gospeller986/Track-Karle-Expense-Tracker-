import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import type { ThemeColorName } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  surface?: ThemeColorName; // which theme color to use as background
};

export function ThemedView({ style, surface = 'bg', ...rest }: ThemedViewProps) {
  const { colors } = useTheme();
  const bg = colors[surface] as string;

  return <View style={[{ backgroundColor: bg }, style]} {...rest} />;
}
