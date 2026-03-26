import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Skeleton } from '@/components/ui/skeleton';

// Approximate bar heights to mimic a real chart silhouette
const BAR_HEIGHTS = [30, 55, 40, 65, 45, 80];

export function SpendingChartSkeleton() {
  const { colors, spacing, radii } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton width={120} height={11} borderRadius={6} />
        <Skeleton width={48} height={11} borderRadius={6} />
      </View>

      {/* Chart card */}
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        borderColor: colors.border,
        borderWidth: 1,
        padding: 16,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 }}>
          {BAR_HEIGHTS.map((h, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <Skeleton width={28} height={h} borderRadius={6} />
              <Skeleton width={20} height={10} borderRadius={5} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
