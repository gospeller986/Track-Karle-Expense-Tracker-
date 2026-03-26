import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Skeleton } from '@/components/ui/skeleton';

export function BalanceCardSkeleton() {
  const { colors, spacing, radii } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: radii['2xl'],
        borderColor: colors.border,
        borderWidth: 1,
        padding: 24,
        gap: 20,
      }}>
        {/* Label + balance */}
        <View style={{ gap: 8 }}>
          <Skeleton width={120} height={11} borderRadius={6} />
          <Skeleton width={180} height={44} borderRadius={8} />
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.border }} />

        {/* Income / Spent split */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Skeleton width={8} height={8} borderRadius={4} />
            <View style={{ gap: 6 }}>
              <Skeleton width={48} height={10} borderRadius={5} />
              <Skeleton width={80} height={18} borderRadius={6} />
            </View>
          </View>
          <View style={{ width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 16 }} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Skeleton width={8} height={8} borderRadius={4} />
            <View style={{ gap: 6 }}>
              <Skeleton width={40} height={10} borderRadius={5} />
              <Skeleton width={80} height={18} borderRadius={6} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
