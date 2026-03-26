import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import * as Haptics from 'expo-haptics';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TabConfig = {
  label: string;
  icon: IoniconName;
  iconFocused: IoniconName;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index:         { label: 'Home',     icon: 'home-outline',      iconFocused: 'home'      },
  expenses:      { label: 'Expenses', icon: 'wallet-outline',    iconFocused: 'wallet'    },
  groups:        { label: 'Groups',   icon: 'people-outline',    iconFocused: 'people'    },
  subscriptions: { label: 'Subs',     icon: 'repeat-outline',    iconFocused: 'repeat'    },
  reports:       { label: 'Reports',  icon: 'bar-chart-outline', iconFocused: 'bar-chart' },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, spacing, radii, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPad = insets.bottom > 0 ? insets.bottom : spacing.md;

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: bottomPad + 2 },
      ]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 72 : 100}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.pill,
          {
            borderRadius: radii['2xl'],
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
            // Android fallback: BlurView doesn't clip to borderRadius — use overflow
            overflow: 'hidden',
          },
        ]}
      >
        {/* Tinted overlay so pill doesn't go fully transparent */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: isDark
                ? 'rgba(18, 18, 18, 0.55)'
                : 'rgba(255, 255, 255, 0.55)',
              borderRadius: radii['2xl'],
            },
          ]}
        />

        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name];
            if (!config) return null;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const iconColor = isFocused ? colors.accent : colors.tabBarInactive;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.tab}
                accessibilityRole="button"
                accessibilityLabel={config.label}
              >
                {isFocused && (
                  <View
                    style={[
                      styles.glowPill,
                      { backgroundColor: colors.accentMuted, borderRadius: radii.lg },
                    ]}
                  />
                )}

                <Ionicons
                  name={isFocused ? config.iconFocused : config.icon}
                  size={22}
                  color={iconColor}
                />

                <ThemedText
                  variant="caption"
                  color={iconColor}
                  style={{ marginTop: 3 }}
                  bold={isFocused}
                >
                  {config.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: -16,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  pill: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  tabRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  glowPill: {
    position: 'absolute',
    top: -2,
    width: 48,
    height: 36,
  },
});
