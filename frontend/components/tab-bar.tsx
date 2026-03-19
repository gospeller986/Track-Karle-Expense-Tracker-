import { View, TouchableOpacity, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import * as Haptics from 'expo-haptics';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TabConfig = {
  label: string;
  icon: IoniconName;       // inactive state
  iconFocused: IoniconName; // active state (filled variant)
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index:         { label: 'Home',     icon: 'home-outline',          iconFocused: 'home'          },
  expenses:      { label: 'Expenses', icon: 'wallet-outline',        iconFocused: 'wallet'        },
  groups:        { label: 'Groups',   icon: 'people-outline',        iconFocused: 'people'        },
  subscriptions: { label: 'Subs',     icon: 'repeat-outline',        iconFocused: 'repeat'        },
  reports:       { label: 'Reports',  icon: 'bar-chart-outline',     iconFocused: 'bar-chart'     },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
        },
      ]}
    >
      <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
              {/* Lime glow pill behind active icon */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
    gap: 0,
  },
  glowPill: {
    position: 'absolute',
    top: -2,
    width: 48,
    height: 36,
  },
});
