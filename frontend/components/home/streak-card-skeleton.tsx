import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Skeleton } from '@/components/ui/skeleton';

export function StreakCardSkeleton() {
  const { colors, spacing, radii } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: radii['2xl'],
        borderColor: colors.border,
        borderWidth: 1,
        padding: 20,
        gap: 12,
      }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={140} height={18} borderRadius={6} />
          <Skeleton width={80} height={28} borderRadius={8} />
        </View>

        {/* Day labels row */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Skeleton width={16} height={10} borderRadius={4} />
            </View>
          ))}
        </View>

        {/* 4 grid rows */}
        {Array.from({ length: 4 }).map((_, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 4 }}>
            {Array.from({ length: 7 }).map((_, ci) => (
              <View key={ci} style={{ flex: 1, alignItems: 'center' }}>
                <Skeleton width={36} height={36} borderRadius={6} />
              </View>
            ))}
          </View>
        ))}

        {/* Message */}
        <Skeleton width="70%" height={11} borderRadius={5} style={{ alignSelf: 'center' }} />
      </View>
    </View>
  );
}
