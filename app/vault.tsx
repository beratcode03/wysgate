import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category, useVault, VaultEntry } from '@/components/VaultProvider';
import { VaultTabBar } from './index';
import { useColors } from '@/hooks/useColors';
import { goBack } from '@/components/navigation';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useI18n } from '@/lib/i18n';

const CATEGORIES: Array<Category | 'Tümü'> = ['Tümü', 'Banka', 'E-posta', 'Sosyal Medya', 'Alışveriş', 'Devlet', 'İş', 'Eğitim', 'Oyun', 'Abonelik', 'Diğer'];

export default function VaultList() {
  const colors = useColors();
  const { t, categoryLabel, language } = useI18n();
  const insets = useSafeAreaInsets();
  const { entries } = useVault();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [view, setView] = useState<'all' | 'favorites'>(filter === 'favorites' ? 'favorites' : 'all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'Tümü'>('Tümü');
  const filtered = useMemo(() => entries.filter((entry) => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';
    const haystack = `${entry.name} ${entry.username} ${entry.website}`.toLocaleLowerCase(locale);
    return haystack.includes(query.toLocaleLowerCase(locale))
      && (category === 'Tümü' || entry.category === category)
      && (view === 'all' || entry.favorite);
  }), [category, entries, language, query, view]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.screen, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 92 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Pressable onPress={() => goBack('/')} accessibilityLabel={t('accessibility.back')} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.heading}>
             <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('passwords.eyebrow')}</Text>
           <Text style={[styles.title, { color: colors.foreground, fontSize: colors.getTextSize(23) }]}>{t('passwords.all')}</Text>
          </View>
          <Pressable onPress={() => router.push('/new')} accessibilityLabel={t('accessibility.addPassword')} hitSlop={10}>
            <Feather name="plus" size={22} color={colors.primary} />
          </Pressable>
        </View>
        <View style={[styles.viewSwitch, { backgroundColor: colors.card, borderColor: colors.border }]}>
           {([['all', t('passwords.all')], ['favorites', t('passwords.favorites')]] as const).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setView(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: view === id }}
              style={[styles.viewOption, view === id && { backgroundColor: colors.primary }]}
            >
              <Feather name={id === 'favorites' ? 'star' : 'archive'} size={15} color={view === id ? colors.primaryForeground : colors.mutedForeground} fill={id === 'favorites' && view === id ? colors.primaryForeground : 'transparent'} />
              <Text style={{ color: view === id ? colors.primaryForeground : colors.mutedForeground, fontSize: 13, fontWeight: '700' }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
           <TextInput value={query} onChangeText={setQuery} placeholder={t('passwords.search')} placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground, fontSize: 16 * colors.textScale }]} />
          {query.length > 0 && <Pressable onPress={() => setQuery('')} accessibilityLabel={t('accessibility.clearSearch')}><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, { backgroundColor: item === category ? colors.accent : 'transparent', borderColor: item === category ? colors.primary : colors.border }]}>
               <Text style={{ color: item === category ? colors.primary : colors.mutedForeground, fontSize: 12, fontWeight: '600' }}>{categoryLabel(item)}</Text>
            </Pressable>
          ))}
        </ScrollView>
         <View style={styles.resultHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: colors.getTextSize(16) }]}>{filtered.length} {view === 'favorites' ? t('passwords.favorites').toLocaleLowerCase() : t('home.entryWord')}</Text>
           <Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('passwords.encrypted')}</Text>
        </View>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name={query ? 'search' : 'archive'} size={22} color={colors.mutedForeground} />
             <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{query ? t('passwords.noResults') : view === 'favorites' ? t('passwords.noFavorites') : t('passwords.noEntries')}</Text>
             <Text style={[styles.caption, { color: colors.mutedForeground }]}>{query ? t('passwords.changeSearch') : view === 'favorites' ? t('passwords.favoriteHint') : t('passwords.firstEntry')}</Text>
          </View>
        ) : filtered.map((entry) => <VaultRow key={entry.id} entry={entry} />)}
      </KeyboardAwareScrollViewCompat>
      <VaultTabBar />
    </View>
  );
}

function VaultRow({ entry }: { entry: VaultEntry }) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <Pressable onPress={() => router.push(`/entry/${entry.id}`)} accessibilityRole="button" accessibilityLabel={t('accessibility.openEntry', { name: entry.name })} style={({ pressed }) => [styles.row, { borderBottomColor: colors.border, opacity: pressed ? 0.65 : 1, minHeight: colors.getTouchSize(66) }]}>
      <View style={[styles.monogram, { backgroundColor: colors.accent }]}>
        <Text style={[styles.monogramText, { color: colors.primary }]}>{entry.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.foreground, fontSize: colors.getTextSize(15) }]} numberOfLines={1}>{entry.name}</Text>
         <Text style={[styles.caption, { color: colors.mutedForeground }]} numberOfLines={1}>{entry.username || t('entry.usernameMissing')}</Text>
      </View>
      {entry.critical && <Feather name="alert-circle" size={16} color={colors.warning} />}
      {entry.favorite && <Feather name="star" size={15} color={colors.warning} fill={colors.warning} />}
      <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  heading: { alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 3 },
  title: { fontSize: 23, fontWeight: '700' },
  search: { minHeight: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  viewSwitch: { minHeight: 46, borderWidth: 1, borderRadius: 11, padding: 4, flexDirection: 'row', gap: 4, marginBottom: 13 },
  viewOption: { flex: 1, minHeight: 36, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  searchInput: { flex: 1, paddingVertical: 11 },
  chips: { gap: 7, paddingVertical: 17 },
  chip: { minHeight: 34, borderWidth: 1, borderRadius: 8, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  resultHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 18 },
  row: { minHeight: 66, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  monogram: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  monogramText: { fontSize: 16, fontWeight: '700' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  empty: { minHeight: 160, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 7, marginTop: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
});