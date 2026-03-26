import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Skeleton } from '@/components/ui/skeleton';

const ROW_COUNT = 4;

export function RecentTransactionsSkeleton() {
  const { colors, spacing, radii } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton width={64} height={11} borderRadius={6} />
        <Skeleton width={52} height={11} borderRadius={6} />
      </View>

      {/* Rows */}
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        borderColor: colors.border,
        borderWidth: 1,
        overflow: 'hidden',
      }}>
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[
              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
              i < ROW_COUNT - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
            ]}
          >
            {/* Icon */}
            <Skeleton width={42} height={42} borderRadius={12} />
            {/* Title + date */}
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="55%" height={13} borderRadius={6} />
              <Skeleton width="35%" height={10} borderRadius={5} />
            </View>
            {/* Amount */}
            <Skeleton width={64} height={13} borderRadius={6} />
          </View>
        ))}
      </View>
    </View>
  );
}
