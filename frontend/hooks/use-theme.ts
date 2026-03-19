import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, typography, spacing, radii, shadows } from '@/constants/theme';
import type { Theme } from '@/constants/theme';

export type AppTheme = {
  colors: typeof darkTheme | typeof lightTheme;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  scheme: 'dark' | 'light';
  isDark: boolean;
};

export function useTheme(): AppTheme {
  // Force dark for now; switching to light is: remove the override below
  // and the hook will auto-follow system preference
  const scheme = 'dark'; // TODO: remove this line to enable system-based theming
  // const scheme = useColorScheme() ?? 'dark';

  return {
    colors:     scheme === 'dark' ? darkTheme : lightTheme,
    typography,
    spacing,
    radii,
    shadows,
    scheme,
    isDark: scheme === 'dark',
  };
}
