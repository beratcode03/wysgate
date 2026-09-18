import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { analyzeVault } from '@/lib/security';
import { useVault, VaultEntry } from '@/components/VaultProvider';
import { VaultTabBar } from './index';
import { goBack } from '@/components/navigation';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useI18n } from '@/lib/i18n';

export default function SecurityCenter() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { entries, settings, ignoreFinding, clearIgnoredFindings } = useVault();
  const analysis = analyzeVault(entries);
  const weak = analysis.weak.filter((entry) => !settings.ignoredFindings.includes(`weak:${entry.id}`));
  const reused = analysis.reused.filter((entry) => !settings.ignoredFindings.includes(`reused:${entry.id}`));
  const old = analysis.old.filter((entry) => !settings.ignoredFindings.includes(`old:${entry.id}`));
  const total = weak.length + reused.length + old.length;
  const critical = entries.filter((entry) => entry.critical);
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
        <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.screen, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
       <View style={styles.top}><Pressable onPress={() => goBack('/')} hitSlop={12}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable><Text style={[styles.title, { color: colors.foreground }]}>{t('security.title')}</Text><View style={{ width: 22 }} /></View>
         <View style={[styles.overview, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
         <View style={[styles.statusDot, { backgroundColor: total === 0 ? colors.success : colors.warning }]} />
           <View style={{ flex: 1 }}><Text style={[styles.overviewTitle, { color: colors.foreground, fontSize: colors.getTextSize(15) }]}>{total === 0 ? t('security.good') : t('security.review')}</Text><Text style={[styles.caption, { color: colors.mutedForeground, fontSize: colors.getTextSize(13) }]}>{settings.simpleMode ? t('security.basic') : `${entries.length} ${t('home.entryWord')} · ${total} ${t('security.alerts')}`}</Text></View>
       </View>
         {critical.length > 0 && <IssueGroup title={t('security.critical')} description={t('security.criticalBody')} icon="alert-circle" items={critical} simpleMode={false} />}
         <IssueGroup title={t('security.weak')} description={t('security.weakBody')} icon="unlock" items={weak} simpleMode={settings.simpleMode} findingPrefix="weak" onIgnore={ignoreFinding} />
         {!settings.simpleMode && <IssueGroup title={t('security.reused')} description={t('security.reusedBody')} icon="copy" items={reused.filter((entry, index, all) => all.findIndex((item) => item.password === entry.password) === index)} simpleMode={false} findingPrefix="reused" onIgnore={ignoreFinding} />}
         {!settings.simpleMode && <IssueGroup title={t('security.old')} description={t('security.oldBody')} icon="clock" items={old} simpleMode={false} findingPrefix="old" onIgnore={ignoreFinding} />}
         {settings.ignoredFindings.length > 0 && <Pressable onPress={() => void clearIgnoredFindings()} style={[styles.ignored, { borderColor: colors.border }]}><Feather name="eye" size={16} color={colors.primary} /><Text style={[styles.caption, { color: colors.primary, flex: 1 }]}>{t('security.restoreIgnored')} ({settings.ignoredFindings.length})</Text><Feather name="rotate-ccw" size={16} color={colors.primary} /></Pressable>}
        {total === 0 && <View style={styles.empty}><Text style={[styles.overviewTitle, { color: colors.foreground }]}>{t('security.none')}</Text><Text style={[styles.caption, { color: colors.mutedForeground, textAlign: 'center' }]}>{t('security.noneBody')}</Text></View>}
         </KeyboardAwareScrollViewCompat>
        <VaultTabBar />
      </View>
  );
}

function IssueGroup({ title, description, icon, items, simpleMode, findingPrefix, onIgnore }: { title: string; description: string; icon: keyof typeof Feather.glyphMap; items: VaultEntry[]; simpleMode: boolean; findingPrefix?: string; onIgnore?: (findingId: string) => Promise<void> }) {
  const colors = useColors();
  const { t } = useI18n();
  if (items.length === 0) return null;
  const isSoftWarning = findingPrefix === 'weak';
   return <View style={styles.group}><View style={styles.groupHeader}><Feather name={icon} size={18} color={isSoftWarning ? colors.mutedForeground : colors.warning} /><View style={{ flex: 1 }}><Text style={[styles.groupTitle, { color: colors.foreground, fontSize: colors.getTextSize(15) }]}>{title} {!simpleMode && <Text style={{ color: isSoftWarning ? colors.mutedForeground : colors.warning }}>({items.length})</Text>}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{description}</Text></View></View>{items.map((item) => <View key={item.id} style={[styles.entry, { borderColor: colors.border, backgroundColor: colors.card, minHeight: colors.getTouchSize(58) }]}><Pressable onPress={() => router.push(`/entry/${item.id}`)} accessibilityRole="button" accessibilityLabel={`${item.name} ${t('passwords.all').toLocaleLowerCase()} aç`} style={styles.entryMain}><View style={[styles.initial, { backgroundColor: colors.accent }]}><Text style={{ color: colors.primary, fontWeight: '700' }}>{item.name.slice(0, 1).toUpperCase()}</Text></View><Text style={[styles.entryName, { color: colors.foreground, fontSize: colors.getTextSize(14) }]}>{item.name}</Text></Pressable>{findingPrefix && onIgnore && <Pressable onPress={() => void onIgnore(`${findingPrefix}:${item.id}`)} hitSlop={8} accessibilityLabel={`${item.name} ${t('security.review').toLocaleLowerCase()}`} style={[styles.ignoreButton, { borderColor: colors.border }]}><Text style={[styles.ignoreText, { color: colors.mutedForeground }]}>{t('entry.dismiss')}</Text></Pressable>}<Feather name="chevron-right" size={17} color={colors.mutedForeground} /></View>)}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700' },
  overview: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 2 },
  overviewTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  caption: { fontSize: 13, lineHeight: 19 },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  groupTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  entry: { minHeight: 58, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10, marginBottom: 7 },
  initial: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  entryName: { flex: 1, fontSize: 14, fontWeight: '600' },
  empty: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8 },
  entryMain: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10 },
  ignored: { minHeight: 48, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 16 },
  ignoreButton: { minHeight: 30, borderWidth: 1, borderRadius: 7, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  ignoreText: { fontSize: 11, fontWeight: '600' },
});