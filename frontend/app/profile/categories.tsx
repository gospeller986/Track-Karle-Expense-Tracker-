import { useEffect, useState } from 'react';
import {
  ScrollView, View, TouchableOpacity, StyleSheet,
  StatusBar, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/hooks/use-categories';
import {
  createCategory, updateCategory, deleteCategory,
  type Category,
} from '@/services/category';

// ── Constants ──────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#FF8A00', '#4D9EFF', '#FF4D9E', '#7B61FF',
  '#00C48C', '#FFD700', '#FF6B6B', '#C9F31D',
  '#00B4D8', '#888888',
];

const TYPE_OPTIONS: { label: string; value: 'expense' | 'income' | 'both' }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income',  value: 'income'  },
  { label: 'Both',    value: 'both'    },
];

type FormState = { name: string; icon: string; color: string; categoryType: 'expense' | 'income' | 'both' };

const EMPTY_FORM: FormState = { name: '', icon: '', color: PRESET_COLORS[0], categoryType: 'expense' };

// ── CategoryRow ────────────────────────────────────────────────────────────

function CategoryRow({ cat, onEdit, onDelete }: {
  cat: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { colors, spacing, radii } = useTheme();
  const typeColor =
    cat.categoryType === 'income' ? '#00C48C' :
    cat.categoryType === 'both'   ? '#4D9EFF' : '#FF8A00';

  return (
    <View style={[styles.catRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      <View style={[styles.iconWrap, { backgroundColor: cat.color + '33', borderRadius: radii.lg }]}>
        <ThemedText style={{ fontSize: 18 }}>{cat.icon}</ThemedText>
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <ThemedText variant="bodySm" semibold>{cat.name}</ThemedText>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '22', borderRadius: radii.xs }]}>
          <ThemedText variant="caption" style={{ color: typeColor, textTransform: 'capitalize' }}>
            {cat.categoryType}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity onPress={onEdit} style={{ padding: spacing.sm }}>
        <Ionicons name="pencil-outline" size={18} color={colors.accent} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={{ padding: spacing.sm, marginLeft: 4 }}>
        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );
}

// ── SystemCategoryRow ──────────────────────────────────────────────────────

function SystemCategoryRow({ cat }: { cat: Category }) {
  const { colors, spacing, radii } = useTheme();
  return (
    <View style={[styles.catRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      <View style={[styles.iconWrap, { backgroundColor: cat.color + '22', borderRadius: radii.lg }]}>
        <ThemedText style={{ fontSize: 18 }}>{cat.icon}</ThemedText>
      </View>
      <ThemedText variant="bodySm" color={colors.textSecondary} style={{ flex: 1, marginLeft: spacing.md }}>
        {cat.name}
      </ThemedText>
      <ThemedText variant="caption" color={colors.textTertiary} style={{ textTransform: 'capitalize' }}>
        {cat.categoryType}
      </ThemedText>
    </View>
  );
}

// ── CategoryFormModal ──────────────────────────────────────────────────────

function CategoryFormModal({ visible, initial, isEditing, onSave, onClose }: {
  visible: boolean;
  initial: FormState;
  isEditing: boolean;
  onSave: (form: FormState) => Promise<void>;
  onClose: () => void;
}) {
  const { colors, spacing, radii } = useTheme();
  const [form, setForm] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (visible) setForm(initial); }, [visible]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.icon.trim()) return;
    setLoading(true);
    await onSave({ ...form, name: form.name.trim(), icon: form.icon.trim() });
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalBox, { backgroundColor: colors.bgElevated, borderRadius: radii['2xl'], borderColor: colors.border, borderWidth: 1 }]}>
          <ThemedText variant="h4" style={{ marginBottom: spacing.lg }}>
            {isEditing ? 'Edit Category' : 'New Category'}
          </ThemedText>

          <Input
            label="Name"
            value={form.name}
            onChangeText={n => setForm(f => ({ ...f, name: n }))}
            placeholder="e.g. Gym"
            autoFocus
          />

          <View style={{ marginTop: spacing.md }}>
            <Input
              label="Icon (emoji)"
              value={form.icon}
              onChangeText={i => setForm(f => ({ ...f, icon: i }))}
              placeholder="e.g. 🏋️"
            />
          </View>

          {/* Color swatches */}
          <ThemedText variant="label" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
            COLOR
          </ThemedText>
          <View style={styles.swatchRow}>
            {PRESET_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setForm(f => ({ ...f, color: c }))}
                style={[
                  styles.swatch,
                  { backgroundColor: c, borderRadius: 18 },
                  form.color === c && { borderWidth: 3, borderColor: colors.textPrimary },
                ]}
              />
            ))}
          </View>

          {/* Type selector */}
          <ThemedText variant="label" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
            TYPE
          </ThemedText>
          <View style={[styles.typeRow, { backgroundColor: colors.surface, borderRadius: radii.lg }]}>
            {TYPE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setForm(f => ({ ...f, categoryType: opt.value }))}
                style={[
                  styles.typeBtn,
                  { borderRadius: radii.md },
                  form.categoryType === opt.value && { backgroundColor: colors.accent },
                ]}
              >
                <ThemedText
                  variant="bodySm"
                  semibold={form.categoryType === opt.value}
                  color={form.categoryType === opt.value ? colors.bg : colors.textSecondary}
                >
                  {opt.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
            <Button label="Cancel" variant="secondary" size="md" style={{ flex: 1 }} onPress={onClose} />
            <Button label="Save" variant="primary" size="md" style={{ flex: 1 }} loading={loading} onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function ProfileCategoriesScreen() {
  const { colors, spacing, isDark } = useTheme();
  const router = useRouter();
  const { categories, isLoading, refetch } = useCategories();

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const customCategories = categories.filter(c => !c.isDefault);
  const systemCategories = categories.filter(c => c.isDefault);

  const initialForm: FormState = editing
    ? { name: editing.name, icon: editing.icon, color: editing.color, categoryType: editing.categoryType }
    : EMPTY_FORM;

  const handleOpenAdd = () => { setEditing(null); setModalVisible(true); };
  const handleOpenEdit = (cat: Category) => { setEditing(cat); setModalVisible(true); };
  const handleClose = () => { setModalVisible(false); setEditing(null); };

  const handleSave = async (form: FormState) => {
    try {
      if (editing) {
        await updateCategory(editing.id, { name: form.name, icon: form.icon, color: form.color, categoryType: form.categoryType });
      } else {
        await createCategory({ name: form.name, icon: form.icon, color: form.color, categoryType: form.categoryType });
      }
      await refetch();
      handleClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save category');
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Existing expenses using this category will not be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteCategory(cat.id);
              await refetch();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete category');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <CategoryFormModal
        visible={modalVisible}
        initial={initialForm}
        isEditing={!!editing}
        onSave={handleSave}
        onClose={handleClose}
      />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText variant="bodyLg" color={colors.textSecondary}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText variant="h4">Categories</ThemedText>
        <TouchableOpacity onPress={handleOpenAdd}>
          <Ionicons name="add-circle-outline" size={26} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: spacing.xl, paddingHorizontal: spacing.xl, gap: spacing.xl }}
        >
          {/* My Categories */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
              MY CATEGORIES
            </ThemedText>
            {customCategories.length === 0 ? (
              <Card>
                <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                  <ThemedText style={{ fontSize: 36, marginBottom: spacing.md }}>🗂️</ThemedText>
                  <ThemedText variant="bodySm" color={colors.textSecondary}>No custom categories yet</ThemedText>
                  <ThemedText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
                    Tap + to create your first one
                  </ThemedText>
                </View>
              </Card>
            ) : (
              <Card padded={false}>
                {customCategories.map((cat, idx) => (
                  <View key={cat.id} style={idx < customCategories.length - 1 ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : undefined}>
                    <CategoryRow cat={cat} onEdit={() => handleOpenEdit(cat)} onDelete={() => handleDelete(cat)} />
                  </View>
                ))}
              </Card>
            )}
          </View>

          {/* System Categories */}
          <View>
            <ThemedText variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
              SYSTEM CATEGORIES
            </ThemedText>
            <Card padded={false}>
              {systemCategories.map((cat, idx) => (
                <View key={cat.id} style={idx < systemCategories.length - 1 ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : undefined}>
                  <SystemCategoryRow cat={cat} />
                </View>
              ))}
            </Card>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  catRow:    { flexDirection: 'row', alignItems: 'center' },
  iconWrap:  { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1, marginTop: 3 },
  overlay:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox:  { width: '100%', padding: 24 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch:    { width: 32, height: 32 },
  typeRow:   { flexDirection: 'row', padding: 4 },
  typeBtn:   { flex: 1, alignItems: 'center', paddingVertical: 8 },
});
