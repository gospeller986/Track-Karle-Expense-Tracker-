import { useRef, useState } from 'react';
import {
  Dimensions, FlatList, StatusBar, StyleSheet,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const ONBOARDING_KEY = 'onboarding_complete';

// ── Illustrations ──────────────────────────────────────────────────────────

function IllustrationTrack() {
  const { colors, spacing, radii } = useTheme();
  const rows = [
    { icon: 'fast-food-outline' as const, label: 'Food & Dining',  amount: '-₹850',     color: colors.expense },
    { icon: 'bag-outline'       as const, label: 'Shopping',       amount: '-₹2,300',   color: colors.expense },
    { icon: 'briefcase-outline' as const, label: 'Salary',         amount: '+₹50,000',  color: colors.income  },
  ];
  return (
    <View style={[styles.illCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
      <ThemedText variant="caption" color={colors.textSecondary}>TOTAL BALANCE</ThemedText>
      <ThemedText style={{ fontSize: 32, fontWeight: '700', color: colors.accent, paddingVertical: spacing['2xl']}}>
        ₹24,580
      </ThemedText>
      <View style={{ height: 1, backgroundColor: colors.border, marginBottom: spacing.md }} />
      {rows.map((r, i) => (
        <View key={i} style={[styles.row, i > 0 && { marginTop: spacing.sm }]}>
          <View style={[styles.iconBubble, { backgroundColor: r.color + '22', borderRadius: radii.full }]}>
            <Ionicons name={r.icon} size={15} color={r.color} />
          </View>
          <ThemedText variant="bodySm" color={colors.textSecondary} style={{ flex: 1, marginLeft: spacing.sm }}>
            {r.label}
          </ThemedText>
          <ThemedText variant="bodySm" semibold color={r.color}>{r.amount}</ThemedText>
        </View>
      ))}
    </View>
  );
}

function IllustrationCategories() {
  const { colors, spacing, radii } = useTheme();
  const cats = [
    { icon: 'fast-food-outline'      as const, label: 'Food',       color: '#FF8A00' },
    { icon: 'car-outline'            as const, label: 'Transport',  color: '#4D9EFF' },
    { icon: 'bag-outline'            as const, label: 'Shopping',   color: '#FF4D9E' },
    { icon: 'heart-outline'          as const, label: 'Health',     color: '#00C48C' },
    { icon: 'film-outline'           as const, label: 'Entertain',  color: '#7B61FF' },
    { icon: 'airplane-outline'       as const, label: 'Travel',     color: '#00B4D8' },
    { icon: 'flash-outline'          as const, label: 'Utilities',  color: '#FFD700' },
    { icon: 'phone-portrait-outline' as const, label: 'Custom',     color: colors.accent },
  ];
  return (
    <View style={[styles.illCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
      <ThemedText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
        CATEGORIES
      </ThemedText>
      <View style={styles.catGrid}>
        {cats.map((c, i) => (
          <View key={i} style={[styles.catChip, { backgroundColor: c.color + '22', borderRadius: radii.md }]}>
            <Ionicons name={c.icon} size={20} color={c.color} />
            <ThemedText variant="caption" color={colors.textSecondary} style={{ marginTop: 4, textAlign: 'center' }}>
              {c.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function IllustrationSplit() {
  const { colors, spacing, radii } = useTheme();
  const people = [
    { name: 'Elena R.',  sub: 'Grocery & Drinks',   amount: '+₹850',   label: 'OWES YOU', color: colors.income  },
    { name: 'Marcus C.', sub: 'Airbnb split',        amount: '-₹1,200', label: 'YOU OWE',  color: colors.expense },
    { name: 'Sarah M.',  sub: 'Settled yesterday',   amount: '₹0',      label: '✓',        color: colors.textTertiary },
  ];
  return (
    <View style={[styles.illCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
      <View style={[styles.row, { marginBottom: spacing.md }]}>
        <ThemedText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>WEEKEND TRIP</ThemedText>
        <ThemedText variant="bodySm" semibold color={colors.accent}>₹8,400</ThemedText>
      </View>
      {people.map((p, i) => (
        <View key={i} style={[styles.row, i > 0 && { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
          <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated, borderRadius: radii.full }]}>
            <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <ThemedText variant="bodySm" semibold>{p.name}</ThemedText>
            <ThemedText variant="caption" color={colors.textTertiary}>{p.sub}</ThemedText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <ThemedText variant="bodySm" semibold color={p.color}>{p.amount}</ThemedText>
            <ThemedText variant="caption" color={p.color}>{p.label}</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

function IllustrationReports() {
  const { colors, spacing, radii } = useTheme();
  const intensities = [
    [0, 1, 2, 1, 0, 2, 3],
    [1, 2, 3, 2, 1, 0, 1],
    [0, 1, 1, 3, 2, 1, 2],
    [2, 0, 1, 2, 3, 1, 0],
    [1, 2, 0, 1, 1, 2, 3],
  ];
  const heatAlpha = (v: number) => (['11', '44', '88', 'EE'][v]);

  return (
    <View style={[styles.illCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, gap: spacing.lg }]}>
      <View>
        <ThemedText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
          DAILY CONSISTENCY
        </ThemedText>
        <View style={{ gap: 5 }}>
          {intensities.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 5 }}>
              {row.map((v, ci) => (
                <View key={ci} style={{ width: 24, height: 24, borderRadius: 5, backgroundColor: colors.accent + heatAlpha(v) }} />
              ))}
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.row, { backgroundColor: colors.accentMuted, borderRadius: radii.lg, padding: spacing.md }]}>
        <View style={[styles.iconBubble, { backgroundColor: colors.accentMuted, borderRadius: radii.full }]}>
          <Ionicons name="trending-up-outline" size={16} color={colors.accent} />
        </View>
        <View style={{ marginLeft: spacing.sm }}>
          <ThemedText variant="caption" color={colors.textSecondary}>FORECAST</ThemedText>
          <ThemedText variant="bodySm" semibold color={colors.accent}>Saving +12% this month</ThemedText>
        </View>
      </View>
    </View>
  );
}

// ── Slide data ─────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 'track',
    title: 'Track Every Rupee',
    subtitle: 'Log expenses and income in seconds. Know exactly where your money goes.',
    Illustration: IllustrationTrack,
  },
  {
    id: 'categories',
    title: 'Smart Categories',
    subtitle: 'Organise spending your way. Create custom categories that fit your life.',
    Illustration: IllustrationCategories,
  },
  {
    id: 'split',
    title: 'Split with Friends',
    subtitle: 'Split bills, track who owes what — no more awkward reminders.',
    Illustration: IllustrationSplit,
  },
  {
    id: 'reports',
    title: 'Reports & Insights',
    subtitle: 'See spending patterns and daily streaks. Stay on top of your budget.',
    Illustration: IllustrationReports,
  },
];

// ── Main screen ────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colors, spacing, shadows } = useTheme();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const skipAll = async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace('/onboarding/setup');
    }
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: spacing.xl }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <item.Illustration />
      </View>
      <View style={{ paddingBottom: spacing.xl, gap: spacing.sm }}>
        <ThemedText style={{ fontSize: 30, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' , paddingTop: spacing['2xl']}}>
          {item.title}
        </ThemedText>
        <ThemedText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', lineHeight: 22 }}>
          {item.subtitle}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', fontStyle: 'italic', color: colors.accent }}>
          Track Karle
        </ThemedText>
        <TouchableOpacity onPress={skipAll} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ThemedText variant="bodySm" color={colors.textSecondary}>Skip</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={s => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
        }}
        style={{ flex: 1 }}
      />

      {/* Footer */}
      <View style={[styles.footer, { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'] }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentIndex ? colors.accent : colors.border },
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Button
          label={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleNext}
          style={currentIndex === SLIDES.length - 1 ? shadows.accent : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  footer:    { gap: 16 },
  dots:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  dot:       { height: 8, width: 8, borderRadius: 4 },
  dotActive: { width: 24, borderRadius: 4 },
  illCard:   { width: '100%', borderWidth: 1, padding: 20 },
  row:       { flexDirection: 'row', alignItems: 'center' },
  iconBubble:{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  catGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip:   { width: '22%', alignItems: 'center', paddingVertical: 10, gap: 4 },
});
