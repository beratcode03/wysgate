import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/components/VaultProvider';
import { PrimaryButton } from '../index';
import { goBack } from '@/components/navigation';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useI18n } from '@/lib/i18n';

export default function EntryDetail() {
  const colors = useColors();
  const { t, categoryLabel } = useI18n();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, toggleFavorite, deleteEntry, copySensitive, settings } = useVault();
  const entry = entries.find((item) => item.id === id);
  const [showPassword, setShowPassword] = useState(false);
   if (!entry) return <View style={[styles.missing, { backgroundColor: colors.background }]}><Text style={{ color: colors.foreground }}>{t('entryDetail.notFound')}</Text></View>;
   const confirmDelete = () => Alert.alert(t('entryDetail.deleteTitle'), t('entryDetail.deleteBody'), [{ text: t('settings.cancel'), style: 'cancel' }, { text: t('entryDetail.delete'), style: 'destructive', onPress: async () => { await deleteEntry(entry.id); goBack('/vault'); } }]);
  return (
    <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
       <View style={styles.top}><Pressable onPress={() => goBack('/vault')} accessibilityLabel={t('accessibility.back')} hitSlop={12}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable><View style={styles.topActions}><Pressable onPress={() => toggleFavorite(entry.id)} hitSlop={12}><Feather name="bookmark" size={20} color={entry.favorite ? colors.warning : colors.foreground} fill={entry.favorite ? colors.warning : 'transparent'} /></Pressable><Pressable onPress={confirmDelete} hitSlop={12}><Feather name="trash-2" size={19} color={colors.destructive} /></Pressable></View></View>
        <View style={[styles.identity, { backgroundColor: colors.accent }]}><View style={[styles.bigIcon, { backgroundColor: colors.primary }]}><Text style={[styles.initial, { color: colors.primaryForeground }]}>{entry.name.slice(0, 1).toUpperCase()}</Text></View><Text style={[styles.title, { color: colors.foreground, fontSize: colors.getTextSize(22) }]}>{entry.name}</Text><Text style={[styles.category, { color: colors.accentForeground, fontSize: colors.getTextSize(13) }]}>{categoryLabel(entry.category)}{entry.critical ? ` · ${t('entryDetail.critical')}` : ''}</Text></View>
       <InfoRow label={t('entry.username')} value={entry.username || t('entryDetail.notAdded')} actionLabel={t('entryDetail.copy')} onAction={() => copySensitive(entry.username, t('entry.username'))} />
       <InfoRow label={t('entry.password')} value={showPassword || settings.hideSensitive ? entry.password : '••••••••••'} actionLabel={showPassword ? t('entryDetail.hide') : t('entryDetail.show')} onAction={() => setShowPassword(!showPassword)} />
       <InfoRow label={t('entryDetail.website')} value={entry.website || t('entryDetail.notAdded')} />
       {entry.note ? <InfoRow label={t('entryDetail.note')} value={entry.note} /> : null}
       <Text style={[styles.updated, { color: colors.mutedForeground }]}>{t('entryDetail.updated')}: {new Date(entry.updatedAt).toLocaleDateString(settings.language === 'en' ? 'en-US' : 'tr-TR')}</Text>
       <PrimaryButton label={t('entryDetail.copyPassword')} onPress={() => copySensitive(entry.password, t('entry.password'))} />
       <Pressable onPress={() => router.push({ pathname: '/new', params: { editId: entry.id } })} style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="edit-2" size={17} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.primary }]}>{t('entryDetail.edit')}</Text></Pressable>
      </KeyboardAwareScrollViewCompat>
  );
}

function InfoRow({ label, value, actionLabel, onAction }: { label: string; value: string; actionLabel?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={[styles.info, { borderBottomColor: colors.border }]}><Text style={[styles.label, { color: colors.mutedForeground, fontSize: colors.getTextSize(12) }]}>{label}</Text><View style={styles.valueRow}><Text style={[styles.value, { color: colors.foreground, fontSize: colors.getTextSize(16) }]} selectable>{value}</Text>{actionLabel && onAction && <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={`${label} için ${actionLabel}`}><Text style={[styles.action, { color: colors.primary, fontSize: colors.getTextSize(13) }]}>{actionLabel}</Text></Pressable>}</View></View>;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  topActions: { flexDirection: 'row', gap: 22 },
  identity: { alignItems: 'center', borderRadius: 12, padding: 22, marginBottom: 20 },
  bigIcon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  initial: { fontSize: 24, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 5 },
  category: { fontSize: 13, fontWeight: '600' },
  info: { paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 12, marginBottom: 7 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { flex: 1, fontSize: 16, fontWeight: '600' },
  action: { fontSize: 13, fontWeight: '700' },
  updated: { fontSize: 12, marginTop: 16, marginBottom: 14 },
  secondaryButton: { minHeight: 53, borderWidth: 1, borderRadius: 10, marginTop: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondaryText: { fontSize: 15, fontWeight: '700' },
});