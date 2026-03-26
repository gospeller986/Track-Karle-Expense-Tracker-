import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width, height, borderRadius = 8, style }: Props) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: false }),
      ])
    ).start();
  }, [anim]);

  const bg = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.shimmerBase, colors.shimmerHighlight],
  });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: bg }, style]}
    />
  );
}
