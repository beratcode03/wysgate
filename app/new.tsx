import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category, useVault } from '@/components/VaultProvider';
import { useColors } from '@/hooks/useColors';
import { PrimaryButton } from './index';
import { goBack } from '@/components/navigation';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useI18n } from '@/lib/i18n';

const CATEGORIES: Category[] = ['Banka', 'E-posta', 'Sosyal Medya', 'Alışveriş', 'Devlet', 'İş', 'Eğitim', 'Oyun', 'Abonelik', 'Diğer'];

function generatePassword(randomBytes: Uint8Array) {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*?'];
  let cursor = 0;
  const take = (group: string) => {
    const value = group[randomBytes[cursor % randomBytes.length] % group.length];
    cursor += 1;
    return value;
  };
  const values = groups.map((group) => take(group));
  while (values.length < 16) {
    const group = groups[values.length % groups.length];
    values.push(take(group));
  }
  return values.map((value, index) => ({ value, sort: randomBytes[(index + cursor) % randomBytes.length] }))
    .sort((left, right) => left.sort - right.sort).map((item) => item.value).join('');
}

export default function NewEntry() {
  const colors = useColors();
  const { t, categoryLabel } = useI18n();
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { entries, addEntry, updateEntry } = useVault();
  const editing = entries.find((item) => item.id === editId);
  const [name, setName] = useState(editing?.name ?? '');
  const [username, setUsername] = useState(editing?.username ?? '');
  const [password, setPassword] = useState(editing?.password ?? '');
  const [website, setWebsite] = useState(editing?.website ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'Diğer');
  const [favorite, setFavorite] = useState(editing?.favorite ?? false);
  const [critical, setCritical] = useState(editing?.critical ?? false);
  const [showPassword, setShowPassword] = useState(false);
  const [showStrengthHint, setShowStrengthHint] = useState(true);
  const [error, setError] = useState('');
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
     return score >= 4 ? t('setup.strong') : score >= 2 ? t('setup.medium') : t('setup.weak');
  }, [password, t]);
  const save = async () => {
    if (!name.trim() || !password) {
       setError(t('entry.required'));
      return;
    }
    const value = { name: name.trim(), username: username.trim(), password, website: website.trim(), note: note.trim(), category, favorite, critical };
    if (editing) await updateEntry(editing.id, value);
    else await addEntry(value);
    goBack('/vault');
  };
  const createStrong = async () => {
    setPassword(generatePassword(await Crypto.getRandomBytesAsync(32)));
  };
  return (
    <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
       <View style={styles.top}><Pressable onPress={() => goBack('/vault')} hitSlop={12}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable><Text style={[styles.title, { color: colors.foreground }]}>{editing ? t('entry.edit') : t('entry.new')}</Text><View style={{ width: 22 }} /></View>
       <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t('entry.subtitle')}</Text>
       <Field label={t('entry.service')} value={name} onChangeText={setName} placeholder={t('entry.servicePlaceholder')} />
       <Field label={t('entry.username')} value={username} onChangeText={setUsername} placeholder="name@example.com" />
         <View style={styles.field}><Text style={[styles.label, { color: colors.foreground, fontSize: colors.getTextSize(14) }]}>{t('entry.password')}</Text><View style={[styles.inputShell, { backgroundColor: colors.card, borderColor: colors.input, minHeight: colors.getTouchSize(53) }]}><TextInput value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder={t('entry.passwordPlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, fontSize: colors.getTextSize(16) }]} autoCapitalize="none" /><Pressable onPress={() => setShowPassword(!showPassword)} accessibilityLabel={showPassword ? t('entry.hidePassword') : t('entry.showPassword')} hitSlop={10}><Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} /></Pressable></View>{password.length > 0 && showStrengthHint && <View style={styles.strengthRow}><Text style={[styles.strength, { color: strength === t('setup.strong') ? colors.success : colors.mutedForeground, fontSize: colors.getTextSize(12) }]}>{t('setup.strength')}: {strength}</Text><Pressable onPress={() => setShowStrengthHint(false)} hitSlop={8}><Text style={[styles.dismissStrength, { color: colors.mutedForeground }]}>{t('entry.dismiss')}</Text></Pressable></View>}<Pressable onPress={createStrong} accessibilityRole="button" accessibilityLabel={t('home.generator')} style={styles.generate}><Feather name="refresh-cw" size={15} color={colors.primary} /><Text style={[styles.generateText, { color: colors.primary, fontSize: colors.getTextSize(13) }]}>{t('home.generator')}</Text></Pressable></View>
       <Field label={t('entry.website')} value={website} onChangeText={setWebsite} placeholder="https://" />
       <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{t('entry.category')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{CATEGORIES.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, { backgroundColor: category === item ? colors.primary : colors.card, borderColor: category === item ? colors.primary : colors.border }]}><Text style={{ color: category === item ? colors.primaryForeground : colors.mutedForeground, fontSize: 13, fontWeight: '600' }}>{categoryLabel(item)}</Text></Pressable>)}</ScrollView></View>
       <Field label={t('entry.note')} value={note} onChangeText={setNote} placeholder={t('entry.notePlaceholder')} multiline />
       <Toggle label={t('entry.addFavorite')} icon="star" value={favorite} onPress={() => setFavorite(!favorite)} />
       <Toggle label={t('entry.critical')} icon="alert-circle" value={critical} onPress={() => setCritical(!critical)} />
      {error.length > 0 ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
       <PrimaryButton label={editing ? t('entry.saveChanges') : t('entry.save')} onPress={save} />
      </KeyboardAwareScrollViewCompat>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; multiline?: boolean }) {
  const colors = useColors();
  return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground, fontSize: colors.getTextSize(14) }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} autoCapitalize="none" style={[styles.textField, multiline && styles.multiline, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground, fontSize: colors.getTextSize(16), minHeight: colors.getTouchSize(53) }]} /></View>;
}

function Toggle({ label, icon, value, onPress }: { label: string; icon: keyof typeof Feather.glyphMap; value: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} style={[styles.toggle, { borderTopColor: colors.border, minHeight: colors.getTouchSize(52) }]}><Feather name={icon} size={18} color={value ? colors.warning : colors.mutedForeground} fill={value && icon === 'star' ? colors.warning : 'transparent'} /><Text style={[styles.toggleText, { color: colors.foreground, fontSize: colors.getTextSize(14) }]}>{label}</Text><View style={[styles.switch, { backgroundColor: value ? colors.primary : colors.muted }]}><View style={[styles.knob, { backgroundColor: value ? colors.primaryForeground : colors.mutedForeground, alignSelf: value ? 'flex-end' : 'flex-start' }]} /></View></Pressable>;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 21, marginBottom: 22 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputShell: { minHeight: 53, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  textField: { minHeight: 53, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  strength: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  dismissStrength: { fontSize: 12, fontWeight: '600', paddingVertical: 4 },
  generate: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9 },
  generateText: { fontSize: 13, fontWeight: '700' },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  toggle: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: StyleSheet.hairlineWidth },
  toggleText: { flex: 1, fontSize: 14, fontWeight: '600' },
  switch: { width: 43, height: 25, borderRadius: 14, padding: 3 },
  knob: { width: 19, height: 19, borderRadius: 10 },
  error: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
});