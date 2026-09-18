import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { passwordScore } from '@/lib/security';
import { goBack } from '@/components/navigation';
import { useI18n } from '@/lib/i18n';

const LENGTHS = [12, 16, 20, 32, 64] as const;

function makePassword(length: number, options: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }, bytes: Uint8Array) {
  const groups = [
    options.upper ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : '',
    options.lower ? 'abcdefghijkmnopqrstuvwxyz' : '',
    options.numbers ? '23456789' : '',
    options.symbols ? '!@#$%&*?+' : '',
  ].filter(Boolean);
  const all = groups.join('');
  if (!all) return '';
  const values = groups.map((group, index) => group[bytes[index] % group.length]);
  for (let index = values.length; index < length; index += 1) values.push(all[bytes[index % bytes.length] % all.length]);
  return values.map((value, index) => ({ value, order: bytes[(index + length) % bytes.length] })).sort((a, b) => a.order - b.order).map((item) => item.value).join('');
}

export default function Generator() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [length, setLength] = useState<number>(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const create = async () => {
    const next = makePassword(length, { upper, lower, numbers, symbols }, await Crypto.getRandomBytesAsync(Math.max(64, length * 2)));
    setPassword(next);
  };
  const copy = async () => {
    await Clipboard.setStringAsync(password);
     Alert.alert(t('generator.copied'), t('generator.copiedBody'));
    setTimeout(() => void Clipboard.setStringAsync(''), 30000);
  };
  return (
    <ScrollView contentContainerStyle={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 30 }]}>
       <View style={styles.top}><Pressable onPress={() => goBack('/')} hitSlop={12}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable><Text style={[styles.title, { color: colors.foreground }]}>{t('generator.title')}</Text><View style={{ width: 22 }} /></View>
       <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t('generator.subtitle')}</Text>
       <Text style={[styles.label, { color: colors.foreground }]}>{t('generator.length')}</Text>
      <View style={styles.options}>{LENGTHS.map((item) => <Pressable key={item} onPress={() => setLength(item)} style={[styles.option, { backgroundColor: length === item ? colors.primary : colors.card, borderColor: length === item ? colors.primary : colors.border }]}><Text style={{ color: length === item ? colors.primaryForeground : colors.mutedForeground, fontWeight: '700' }}>{item}</Text></Pressable>)}</View>
       <Text style={[styles.label, { color: colors.foreground, marginTop: 22 }]}>{t('generator.characters')}</Text>
       <Toggle label={t('generator.upper')} value={upper} onPress={() => setUpper(!upper)} />
       <Toggle label={t('generator.lower')} value={lower} onPress={() => setLower(!lower)} />
       <Toggle label={t('generator.number')} value={numbers} onPress={() => setNumbers(!numbers)} />
       <Toggle label={t('generator.symbol')} value={symbols} onPress={() => setSymbols(!symbols)} />
       <View style={[styles.passwordBox, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.password, { color: colors.foreground }]} selectable>{password || t('generator.placeholder')}</Text>{password && <Text style={[styles.strength, { color: passwordScore(password) >= 4 ? colors.success : colors.warning }]}>{t('setup.strength')}: {passwordScore(password) >= 4 ? t('setup.strong') : passwordScore(password) >= 2 ? t('setup.medium') : t('setup.weak')}</Text>}</View>
       <Pressable onPress={create} style={[styles.action, { backgroundColor: colors.primary }]}><Feather name="refresh-cw" size={17} color={colors.primaryForeground} /><Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>{t('generator.refresh')}</Text></Pressable>
       <Pressable disabled={!password} onPress={copy} style={[styles.secondary, { borderColor: colors.border, opacity: password ? 1 : 0.45 }]}><Feather name="copy" size={17} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '700' }}>{t('generator.copy')}</Text></Pressable>
      </ScrollView>
  );
}

function Toggle({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.toggle, { borderBottomColor: colors.border }]}><Text style={{ color: colors.foreground, flex: 1, fontSize: 15 }}>{label}</Text><View style={[styles.switch, { backgroundColor: value ? colors.primary : colors.muted }]}><View style={[styles.knob, { backgroundColor: value ? colors.primaryForeground : colors.mutedForeground, alignSelf: value ? 'flex-end' : 'flex-start' }]} /></View></Pressable>;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 21, marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  options: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, minHeight: 43, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggle: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  switch: { width: 43, height: 25, borderRadius: 14, padding: 3 },
  knob: { width: 19, height: 19, borderRadius: 10 },
  passwordBox: { minHeight: 110, borderWidth: 1, borderRadius: 10, padding: 15, justifyContent: 'center', marginTop: 24, marginBottom: 12 },
  password: { fontSize: 18, fontWeight: '700', letterSpacing: 0.4 },
  strength: { fontSize: 13, fontWeight: '700', marginTop: 12 },
  action: { minHeight: 52, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 10 },
  secondary: { minHeight: 52, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
});