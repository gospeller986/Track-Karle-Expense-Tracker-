import { darkTheme, lightTheme, typography, spacing, radii, shadows } from '@/constants/theme';
import { useThemeScheme } from '@/context/theme-context';

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
  const { scheme } = useThemeScheme();

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
