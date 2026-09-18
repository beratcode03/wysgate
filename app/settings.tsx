import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AppSettings, useVault } from '@/components/VaultProvider';
import { goBack } from '@/components/navigation';
import { PaletteId, PaletteTokens, themePalettes } from '@/constants/colors';
import { BrandFooter, PrimaryButton, VaultTabBar } from './index';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useI18n } from '@/lib/i18n';

type SettingsSheetName = 'password' | 'autoLock' | 'theme' | 'palette' | 'personalization' | 'privacy' | 'faq' | 'language';

export default function Settings() {
  const colors = useColors();
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, setBiometric, lock, changeMasterPassword, wipeAllData, exportBackup, importBackup } = useVault();
  const [activeSheet, setActiveSheet] = useState<SettingsSheetName | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [backupError, setBackupError] = useState('');
  const [name, setName] = useState(settings.name);
  const [surname, setSurname] = useState(settings.surname);
  const savePassword = async () => {
    const result = await changeMasterPassword(current, next);
     if (result) Alert.alert(t('settings.masterPassword'), result);
     else { setActiveSheet(null); setCurrent(''); setNext(''); Alert.alert(t('settings.updatePassword'), t('settings.masterChanged')); }
  };
  const handleExport = async () => {
    setBackupMessage('');
    setBackupError('');
    if (backupPassword.length < 8) {
       setBackupError(t('settings.backupPasswordMin'));
      return;
    }
    if (backupPassword !== backupPasswordConfirm) {
       setBackupError(t('settings.backupPasswordMismatch'));
      return;
    }
    setBackupBusy(true);
    try {
      const payload = await exportBackup(backupPassword);
      if (!isEncryptedBackupPayload(payload)) {
        setBackupError(payload || t('error.backupCreate'));
        return;
      }
      if (Platform.OS === 'web') {
        if (downloadWebBackup(payload)) {
           setBackupMessage(t('settings.backupDownloaded'));
        } else {
          await Clipboard.setStringAsync(payload);
           setBackupMessage(t('settings.backupDownloadUnavailable'));
        }
        return;
      }
      if (!FileSystem.cacheDirectory) {
        await Clipboard.setStringAsync(payload);
         setBackupMessage(t('settings.backupFileUnavailable'));
        return;
      }
      const uri = `${FileSystem.cacheDirectory}wysgate-yedek.txt`;
      await FileSystem.writeAsStringAsync(uri, payload, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
         await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: t('settings.backupTitle') });
         setBackupMessage(t('settings.backupShared'));
      } else {
        await Clipboard.setStringAsync(payload);
         setBackupMessage(t('settings.backupSharingUnavailable'));
      }
    } catch {
       setBackupError(t('settings.backupExportFailed'));
    } finally {
      setBackupBusy(false);
    }
  };
  const handleImport = async () => {
    setBackupMessage('');
    setBackupError('');
    if (backupPassword.length < 8) {
       setBackupError(t('settings.backupRestorePassword'));
      return;
    }
    setBackupBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/plain', copyToCacheDirectory: true });
      if (result.canceled || !result.assets[0]) return;
      const payload = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      const error = await importBackup(payload, backupPassword);
      if (error) setBackupError(error);
       else setBackupMessage(t('settings.backupRestored'));
    } catch {
       setBackupError(t('settings.backupReadFailed'));
    } finally {
      setBackupBusy(false);
    }
  };
  const handleDeleteAll = async () => {
    if (wiping) return;
    setDeleteError('');
    setWiping(true);
    try {
      const error = await wipeAllData(deletePassword);
      if (error) {
        setDeleteError(error);
        return;
      }
      setDeleting(false);
      setDeletePassword('');
      router.replace('/');
    } finally {
      setWiping(false);
    }
  };
  const beginDeleteAll = () => {
    setDeleteError('');
    setDeletePassword('');
    setDeleting(true);
  };
   const showPrivacyDetails = () => setActiveSheet('privacy');
  return (
     <View style={[styles.root, { backgroundColor: colors.background }]}>
        <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.screen, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 76 }]} keyboardShouldPersistTaps="handled">
       <View style={styles.top}><Pressable onPress={() => goBack('/')} hitSlop={12}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable><Text style={[styles.title, { color: colors.foreground }]}>{t('settings.title')}</Text><View style={{ width: 22 }} /></View>
       <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{t('settings.security')}</Text>
        <SettingRow label={t('settings.masterPassword')} icon="key" onPress={() => setActiveSheet('password')} />
       <SettingRow label={t('settings.biometric')} detail={settings.biometric ? t('settings.on') : t('settings.off')} icon="smile" toggle value={settings.biometric} onPress={async () => { const result = await setBiometric(!settings.biometric); if (result) Alert.alert(t('settings.biometric'), result); }} />
        <SettingRow label={t('settings.autoLock')} detail={autoLockLabel(settings.autoLock, language)} icon="clock" onPress={() => setActiveSheet('autoLock')} />
       <SettingRow label={t('settings.lockOnOpen')} icon="lock" toggle value={settings.lockOnOpen} onPress={() => updateSettings({ lockOnOpen: !settings.lockOnOpen })} />
       <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{t('settings.appearance')}</Text>
        <SettingRow label={t('settings.theme')} detail={settings.theme === 'system' ? t('settings.system') : settings.theme === 'light' ? t('settings.light') : t('settings.dark')} icon="sun" onPress={() => setActiveSheet('theme')} />
        <SettingRow label={t('settings.palette')} detail={settings.monochrome ? t('settings.monochrome') : t('settings.paletteCustom')} icon="droplet" onPress={() => setActiveSheet('palette')} />
       <SettingRow label={t('settings.monochrome')} detail={t('settings.blackWhite')} icon="circle" toggle value={settings.monochrome} onPress={() => updateSettings({ monochrome: !settings.monochrome })} />
        <SettingRow label={t('settings.textSize')} detail={settings.textScale === 0.9 ? t('settings.small') : settings.textScale === 1 ? t('settings.normal') : t('settings.large')} icon="type" onPress={() => {
         const values = [0.9, 1, 1.12] as const;
        void updateSettings({ textScale: values[(values.indexOf(settings.textScale) + 1) % values.length] });
      }} />
        <SettingRow label={t('settings.touchTargets')} detail={settings.touchScale === 0.9 ? t('settings.small') : settings.touchScale === 1 ? t('settings.normal') : t('settings.large')} icon="maximize-2" onPress={() => {
         const values = [0.9, 1, 1.12] as const;
         void updateSettings({ touchScale: values[(values.indexOf(settings.touchScale) + 1) % values.length] });
       }} />
       <SettingRow label={t('settings.highContrast')} icon="sun" toggle value={settings.highContrast} onPress={() => updateSettings({ highContrast: !settings.highContrast })} />
       <SettingRow label={t('settings.mode')} detail={settings.simpleMode ? t('settings.simple') : t('settings.standard')} icon="sliders" onPress={() => updateSettings({ simpleMode: !settings.simpleMode })} />
        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{t('settings.personalization')}</Text>
        <SettingRow label={t('settings.personalInfo')} detail={settings.name ? `${settings.name} ${settings.surname}`.trim() : t('settings.greeting')} icon="user" onPress={() => setActiveSheet('personalization')} />
       <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{t('settings.tools')}</Text>
       <SettingRow label={t('settings.generator')} detail={t('settings.generatorDetail')} icon="key" onPress={() => router.push('/generator')} />
       <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{t('settings.data')}</Text>
      <View style={[styles.backupBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
         <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('settings.backupTitle')}</Text>
          <Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{t('settings.backupDetail')}</Text>
          <TextField label={t('settings.backupPassword')} value={backupPassword} onChangeText={setBackupPassword} />
          <TextField label={t('settings.backupConfirm')} value={backupPasswordConfirm} onChangeText={setBackupPasswordConfirm} />
          <Text style={[styles.backupHint, { color: colors.mutedForeground }]}>{t('settings.backupHint')}</Text>
        <View style={styles.backupActions}><Pressable disabled={backupBusy} onPress={handleExport} style={[styles.backupButton, { backgroundColor: colors.primary, opacity: backupBusy ? 0.55 : 1 }]}><Feather name="download" size={15} color={colors.primaryForeground} /><Text style={[styles.backupButtonText, { color: colors.primaryForeground }]}>{backupBusy ? t('settings.pleaseWait') : t('settings.export')}</Text></Pressable><Pressable disabled={backupBusy} onPress={handleImport} style={[styles.backupButton, { borderColor: colors.border, borderWidth: 1, opacity: backupBusy ? 0.55 : 1 }]}><Feather name="upload" size={15} color={colors.primary} /><Text style={[styles.backupButtonText, { color: colors.primary }]}>{t('settings.import')}</Text></Pressable></View>
         {backupError && <Text style={[styles.inlineError, { color: colors.destructive }]}>{backupError}</Text>}
         {backupMessage && <Text style={[styles.inlineMessage, { color: colors.success }]}>{backupMessage}</Text>}
      </View>
         <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{t('settings.aboutPrivacy')}</Text>
         <SettingRow label={t('settings.privacy')} detail={t('settings.privacyDetail')} icon="minus" onPress={showPrivacyDetails} />
        <SettingRow label={t('settings.faq')} detail={t('settings.faqDetail')} icon="help-circle" onPress={() => setActiveSheet('faq')} />
        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{t('settings.languageGroup')}</Text>
        <SettingRow label={t('settings.language')} detail={settings.language === 'tr' ? 'Türkçe' : 'English'} icon="globe" onPress={() => setActiveSheet('language')} />
         <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{t('settings.danger')}</Text>
        <Pressable onPress={lock} style={[styles.lockButton, { borderColor: colors.border }]}><Feather name="lock" size={17} color={colors.primary} /><Text style={[styles.lockText, { color: colors.primary }]}>{t('settings.lockNow')}</Text></Pressable>
        <SettingRow label={t('settings.deleteAll')} icon="trash-2" destructive onPress={beginDeleteAll} />
        {deleting && <View style={[styles.passwordBox, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
          <Text style={[styles.deleteWarning, { color: colors.destructive }]}>{t('settings.deleteWarning')}</Text>
          <TextField label={t('setup.masterPassword')} value={deletePassword} onChangeText={setDeletePassword} />
          {deleteError && <Text style={[styles.inlineError, { color: colors.destructive }]}>{deleteError}</Text>}
          <View style={styles.deleteActions}>
             <Pressable disabled={wiping} onPress={() => setDeleting(false)} style={[styles.cancelDeleteButton, { borderColor: colors.border, opacity: wiping ? 0.55 : 1 }]}><Text style={{ color: colors.mutedForeground, fontWeight: '700' }}>{t('settings.cancel')}</Text></Pressable>
             <Pressable disabled={wiping} onPress={handleDeleteAll} style={[styles.deleteButton, { backgroundColor: colors.destructive, opacity: wiping ? 0.55 : 1 }]}><Text style={{ color: colors.destructiveForeground, fontWeight: '700' }}>{wiping ? t('settings.waitingVerification') : t('settings.deletePermanently')}</Text></Pressable>
          </View>
       </View>}
        <BrandFooter />
       {activeSheet && <SettingsSheet activeSheet={activeSheet} onClose={() => setActiveSheet(null)} settings={settings} updateSettings={updateSettings} current={current} next={next} setCurrent={setCurrent} setNext={setNext} savePassword={savePassword} name={name} surname={surname} setName={setName} setSurname={setSurname} />}
         </KeyboardAwareScrollViewCompat>
        <VaultTabBar />
      </View>
  );
}

type AppSettingsKey = AppSettings['autoLock'];

function autoLockLabel(value: AppSettingsKey, language: 'tr' | 'en') {
  if (value === 'immediately') return language === 'en' ? 'Immediately' : 'Hemen';
  if (value === '30s') return language === 'en' ? '30 seconds' : '30 saniye';
  if (value === 'never') return language === 'en' ? 'Never' : 'Asla';
  return language === 'en' ? `${value} minutes` : `${value} dakika`;
}

function isEncryptedBackupPayload(payload: string | null): payload is string {
  if (!payload) return false;
  const separator = payload.indexOf('.');
  return separator > 0 && separator < payload.length - 1 && payload.indexOf('.', separator + 1) === -1;
}

function downloadWebBackup(payload: string) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return false;
  const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'wysgate-yedek.txt';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

function TextField({ label, value, onChangeText, secure = true }: { label: string; value: string; onChangeText: (value: string) => void; secure?: boolean }) {
  const colors = useColors();
  return <View style={{ marginBottom: 11 }}><Text style={[styles.label, { color: colors.foreground, fontSize: 13 * colors.textScale }]}>{label}</Text><View style={[styles.textField, { borderColor: colors.input, backgroundColor: colors.background }]}><TextInput value={value} onChangeText={onChangeText} secureTextEntry={secure} autoCapitalize="none" style={{ color: colors.foreground, fontSize: 15 * colors.textScale, flex: 1 }} /></View></View>;
}

function ThemeModeSelector({ value, onChange }: { value: 'system' | 'light' | 'dark'; onChange: (value: 'system' | 'light' | 'dark') => void }) {
  const colors = useColors();
  const { t } = useI18n();
  return <View style={styles.modeRow}>{([['system', t('settings.system')], ['light', t('settings.light')], ['dark', t('settings.dark')]] as const).map(([id, label]) => <Pressable key={id} onPress={() => onChange(id)} style={[styles.modeButton, { backgroundColor: value === id ? colors.primary : colors.card, borderColor: value === id ? colors.primary : colors.border }]}><Text style={{ color: value === id ? colors.primaryForeground : colors.mutedForeground, fontSize: 13, fontWeight: '700' }}>{label}</Text>{value === id && <Feather name="check" size={14} color={colors.primaryForeground} />}</Pressable>)}</View>;
}

function PaletteSelector({ title, mode, value, onChange }: { title: string; mode: 'light' | 'dark'; value: PaletteId; onChange: (value: PaletteId) => void }) {
  const colors = useColors();
  const { language } = useI18n();
  const names: Record<PaletteId, [string, string]> = { 'minimal-purple': ['Minimal Mor', 'Minimal Purple'], 'soft-purple': ['Yumuşak Mor', 'Soft Purple'], 'matte-plum': ['Mat Erik', 'Matte Plum'], 'glacial-indigo': ['Buzul İndigo', 'Glacial Indigo'], 'cream-plum': ['Krem Erik', 'Cream Plum'], 'sage-stone': ['Adaçayı Taş', 'Sage Stone'], terracotta: ['Kiremit', 'Terracotta'], 'ocean-ink': ['Okyanus Mürekkep', 'Ocean Ink'], sandstone: ['Kumtaşı', 'Sandstone'], 'blue-slate': ['Mavi Arduvaz', 'Blue Slate'], 'forest-night': ['Orman Gece', 'Forest Night'], 'copper-night': ['Bakır Gece', 'Copper Night'], 'ocean-night': ['Okyanus Gece', 'Ocean Night'], 'graphite-night': ['Grafit Gece', 'Graphite Night'], 'plum-night': ['Erik Gece', 'Plum Night'] };
   return <View style={styles.paletteSection}><Text style={[styles.subsection, { color: colors.foreground }]}>{title}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteList}>{(Object.keys(themePalettes[mode]) as PaletteId[]).map((id) => <PaletteCard key={id} name={names[id][language === 'tr' ? 0 : 1]} palette={themePalettes[mode][id]} selected={value === id} onPress={() => onChange(id)} />)}</ScrollView></View>;
}

function LanguageSelector({ value, onChange }: { value: 'tr' | 'en'; onChange: (value: 'tr' | 'en') => void }) {
  const colors = useColors();
  return (
    <View style={styles.modeRow}>
      {(['tr', 'en'] as const).map((language) => (
        <Pressable key={language} onPress={() => onChange(language)} style={[styles.modeButton, { backgroundColor: value === language ? colors.primary : colors.card, borderColor: value === language ? colors.primary : colors.border }]}>
          <Text style={{ color: value === language ? colors.primaryForeground : colors.mutedForeground, fontSize: 13, fontWeight: '700' }}>{language === 'tr' ? 'Türkçe' : 'English'}</Text>
          {value === language && <Feather name="check" size={14} color={colors.primaryForeground} />}
        </Pressable>
      ))}
    </View>
  );
}

function PaletteCard({ name, palette, selected, onPress }: { name: string; palette: PaletteTokens; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.paletteCard, { backgroundColor: palette.background, borderColor: selected ? palette.primary : palette.border }]}><View style={[styles.previewTop, { backgroundColor: palette.card }]}><View style={[styles.previewLine, { backgroundColor: palette.primary }]} /><View style={[styles.previewLineShort, { backgroundColor: palette.mutedForeground }]} /></View><View style={[styles.previewAction, { backgroundColor: palette.primary }]} /><Text style={{ color: palette.foreground, fontSize: 11, fontWeight: '700', marginTop: 7 }}>{name}</Text>{selected && <View style={[styles.paletteCheck, { backgroundColor: palette.primary }]}><Feather name="check" size={11} color={palette.primaryForeground} /></View>}</Pressable>;
}

function ChoiceRow<T extends string>({ values, selected, onChange }: { values: Array<[T, string]>; selected: T; onChange: (value: T) => void }) {
  const colors = useColors();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceList}>{values.map(([id, label]) => <Pressable key={id} onPress={() => onChange(id)} style={[styles.choice, { backgroundColor: selected === id ? colors.primary : colors.background, borderColor: selected === id ? colors.primary : colors.border }]}><Text style={{ color: selected === id ? colors.primaryForeground : colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{label}</Text></Pressable>)}</ScrollView>;
}

function SettingsSheet({
  activeSheet,
  onClose,
  settings,
  updateSettings,
  current,
  next,
  setCurrent,
  setNext,
  savePassword,
  name,
  surname,
  setName,
  setSurname,
}: {
  activeSheet: SettingsSheetName;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  current: string;
  next: string;
  setCurrent: (value: string) => void;
  setNext: (value: string) => void;
  savePassword: () => Promise<void>;
  name: string;
  surname: string;
  setName: (value: string) => void;
  setSurname: (value: string) => void;
}) {
  const colors = useColors();
  const { t, language } = useI18n();
  const saveProfile = async () => {
    await updateSettings({ name: name.trim(), surname: surname.trim() });
    onClose();
  };
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay + '66' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.sheetHeader}>
             <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
               {activeSheet === 'password' ? t('settings.masterPassword') : activeSheet === 'autoLock' ? t('settings.autoLock') : activeSheet === 'theme' ? t('settings.theme') : activeSheet === 'palette' ? t('settings.palette') : activeSheet === 'personalization' ? t('settings.personalization') : activeSheet === 'faq' ? t('settings.faq') : activeSheet === 'language' ? t('settings.language') : t('settings.privacyHeading')}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}><Feather name="x" size={20} color={colors.foreground} /></Pressable>
          </View>
           {activeSheet === 'password' && <><TextField label={t('settings.currentPassword')} value={current} onChangeText={setCurrent} /><TextField label={t('settings.newPassword')} value={next} onChangeText={setNext} /><PrimaryButton label={t('settings.updatePassword')} onPress={savePassword} /></>}
           {activeSheet === 'autoLock' && <View>{(['immediately', '30s', '1', '5', '15', '30', 'never'] as AppSettingsKey[]).map((value) => <Pressable key={value} onPress={() => { void updateSettings({ autoLock: value }); onClose(); }} style={[styles.modalOption, { borderBottomColor: colors.border }]}><Text style={[styles.rowLabel, { color: colors.foreground }]}>{autoLockLabel(value, settings.language)}</Text>{settings.autoLock === value && <Feather name="check" size={17} color={colors.primary} />}</Pressable>)}</View>}
          {activeSheet === 'theme' && <ThemeModeSelector value={settings.theme} onChange={(theme) => { void updateSettings({ theme }); onClose(); }} />}
          {activeSheet === 'palette' && <><PaletteSelector title={t('settings.themeLight')} mode="light" value={settings.lightPalette} onChange={(lightPalette) => void updateSettings({ lightPalette })} /><PaletteSelector title={t('settings.themeDark')} mode="dark" value={settings.darkPalette} onChange={(darkPalette) => void updateSettings({ darkPalette })} /></>}
          {activeSheet === 'personalization' && <><TextField label={t('settings.name')} value={name} onChangeText={setName} secure={false} /><TextField label={t('settings.surname')} value={surname} onChangeText={setSurname} secure={false} /><Text style={[styles.label, { color: colors.foreground }]}>{t('settings.salutation')}</Text><ChoiceRow values={[['bey', t('settings.salutationMr')], ['hanim', t('settings.salutationMs')], ['none', t('settings.doNotUse')]]} selected={settings.salutation} onChange={(salutation) => void updateSettings({ salutation })} /><Text style={[styles.label, { color: colors.foreground, marginTop: 8 }]}>{t('settings.welcomeMessage')}</Text><ChoiceRow values={[['automatic', t('settings.automatic')], ['welcome', language === 'en' ? 'Welcome' : 'Hoş geldiniz'], ['hello', language === 'en' ? 'Hello' : 'Merhaba'], ['selam', language === 'en' ? 'Hi' : 'Selam'], ['custom', t('settings.custom')]]} selected={settings.greetingMode} onChange={(greetingMode) => void updateSettings({ greetingMode })} />{settings.greetingMode === 'custom' && <TextField label={t('settings.customMessage')} value={settings.customGreeting} onChangeText={(customGreeting) => void updateSettings({ customGreeting })} secure={false} />}<Pressable onPress={saveProfile} style={[styles.saveProfile, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 13 }}>{t('settings.saveProfile')}</Text></Pressable></>}
           {activeSheet === 'language' && <LanguageSelector value={settings.language} onChange={(language) => { void updateSettings({ language }); onClose(); }} />}
            {activeSheet === 'privacy' && <PrivacyStatement />}
            {activeSheet === 'faq' && <FaqStatement />}
        </View>
      </View>
    </Modal>
  );
}

function PrivacyStatement() {
  const colors = useColors();
  const { t, language } = useI18n();
  const sections = language === 'en'
    ? [
      ['01', 'Your data', 'Vault entries and personalization settings stay on your device. The app does not create a server account, advertising profile, or central password database. Security analysis runs locally and sensitive values are not sent to an analytics service.'],
      ['02', 'Vault security', 'The master password is the primary protection for the vault and is not stored as plain text. When the vault locks, decrypted entries and the active key are cleared from memory where possible. Biometric sign-in uses the operating system verification.'],
      ['03', 'Backups and restore', 'An exported backup is encrypted with a separate backup password. That password is not stored on the device and a lost password may make the backup unrecoverable. Each backup keeps the password it was created with.'],
      ['04', 'Data deletion', 'Delete all data removes the encrypted vault, verification data, biometric key, settings, and privacy acknowledgement after the master password is verified. This cannot be undone and the next launch starts onboarding again.'],
      ['05', 'Platforms', 'SecureStore, real biometrics, and native clipboard behavior on Android and iOS depend on the device. Web and Windows storage and biometric support do not provide the same security surface as native apps.'],
      ['06', 'Network, third parties, and rights', 'The vault flow is not designed to send entries to a Wysgate server. Shared backup files, operating-system backups, and clipboard history are outside security surfaces. Consider applicable access, correction, deletion, restriction, and portability rights under the relevant law.'],
      ['07', 'Security limits', 'Device locks, operating-system accounts, root or jailbreak access, malware, screenshots, leaked backups, and lost master passwords are risks the app cannot control alone. Use a secure device and a strong, unique master password.'],
    ]
    : [
      ['01', 'Verileriniz', 'Kasa kayıtları ve kişiselleştirme tercihleri cihazınızda tutulur. Uygulama sunucu hesabı, reklam profili veya merkezi parola veritabanı oluşturmaz. Güvenlik analizleri cihaz üzerinde yapılır; hassas değerler uygulama dışı bir analitik servise loglanmaz.'],
      ['02', 'Kasa güvenliği', 'Ana şifre kasanın ana korumasıdır ve kalıcı olarak düz metin halinde saklanmaz. Kasa kilitlendiğinde çözülmüş kayıtlar ve aktif anahtar bellekten temizlenmeye çalışılır. Biyometrik giriş cihaz işletim sisteminin doğrulamasını kullanır.'],
      ['03', 'Yedekleme ve geri yükleme', 'Dışa aktarılan yedek, ayrı bir yedek şifresiyle şifrelenir. Bu şifre cihazda saklanmaz; kaybedilirse ilgili yedeğin açılması mümkün olmayabilir. Her yedek oluşturulduğu şifreyle açılır.'],
      ['04', 'Veri silme', 'Tüm verileri sil, ana şifre doğrulamasından sonra şifreli kasa verisini, doğrulama bilgisini, biyometrik anahtarı, ayarları ve gizlilik onayını kaldırır. İşlem geri alınamaz; sonraki açılışta onboarding yeniden gösterilir.'],
      ['05', 'Platformlar', 'Android ve iOS\'ta SecureStore, gerçek biyometri ve native pano davranışı cihaz özelliklerine bağlıdır. Web ve Windows ortamlarında depolama ve biyometri desteği native uygulamalarla aynı güvenlik yüzeyi değildir.'],
      ['06', 'Ağ, üçüncü taraflar ve haklar', 'Kasa akışı ağ üzerinden bir Wysgate sunucusuna gönderilecek şekilde tasarlanmamıştır. Paylaşılan yedek dosyası, işletim sistemi yedekleri ve pano geçmişi uygulamanın dışındaki güvenlik yüzeyleridir. KVKK/GDPR kapsamında uygulanabilir olduğu ölçüde erişim, düzeltme, silme, kısıtlama ve taşınabilirlik haklarınızı değerlendirin.'],
      ['07', 'Güvenlik sınırları', 'Cihaz kilidi, işletim sistemi hesabı, root/jailbreak, zararlı yazılım, ekran görüntüsü, yedek sızıntısı ve ana şifrenin kaybedilmesi uygulamanın tek başına kontrol edemeyeceği risklerdir. Güvenli bir cihaz ve güçlü, benzersiz bir ana şifre kullanın.'],
    ];
  return (
    <ScrollView style={styles.privacyScroll} contentContainerStyle={styles.privacyCopy}>
      <View style={[styles.privacyIntro, { borderBottomColor: colors.border }]}>
        <Text style={[styles.infoEyebrow, { color: colors.primary }]}>{t('settings.privacyHeading')}</Text>
        <Text style={[styles.privacyLead, { color: colors.foreground }]}>{t('settings.privacyLead')}</Text>
        <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>{t('settings.privacyDisclaimer')}</Text>
      </View>
      {sections.map(([index, title, body]) => <PrivacyCard key={index} index={index} title={title}>{body}</PrivacyCard>)}
    </ScrollView>
  );
}

function FaqStatement() {
  const colors = useColors();
  const { language, t } = useI18n();
  const questions = language === 'en'
    ? [
      ['Where are my entries stored?', 'Entries are encrypted and stored on this device by default. The app does not use a central password account or password server.'],
      ['What happens if I forget my master password?', 'The master password is the primary protection for the vault. Without it or the backup password for a specific backup, the data may not be recoverable.'],
      ['Is the backup password the same as the master password?', 'No. It is chosen separately when a backup is exported and is not stored on the device.'],
      ['What happens to current entries when I restore a backup?', 'Restore replaces the current entry list with the entries in the backup. Create a fresh backup first if you need to keep the current vault.'],
      ['Does biometric sign-in replace the master password?', 'No. Biometrics use the operating system verification for quick access. Keep the master password stored safely.'],
      ['What happens when I delete all data?', 'Entries, verification data, the biometric key, settings, and privacy acknowledgement are deleted. This cannot be undone.'],
    ]
    : [
      ['Kayıtlarım nerede saklanır?', 'Kayıtlar varsayılan olarak bu cihazda şifreli şekilde tutulur. Uygulama merkezi bir parola hesabı veya parola sunucusu kullanmaz.'],
      ['Ana şifremi unutursam ne olur?', 'Ana şifre kasanın ana korumasıdır. Şifre veya ilgili yedeğin yedek şifresi olmadan verileri geri getirmek mümkün olmayabilir.'],
      ['Yedek şifresi ana şifreyle aynı mı?', 'Hayır. Yedek dışa aktarılırken ayrıca belirlediğiniz şifredir ve cihazda saklanmaz.'],
      ['Yedeği geri yüklersem mevcut kayıtlar ne olur?', 'Geri yükleme mevcut kayıt listesinin yerine yedekteki kayıtları koyar. Mevcut kasanızı korumak istiyorsanız önce güncel bir yedek alın.'],
      ['Biyometrik giriş ana şifrenin yerini alır mı?', 'Hayır. Biyometri, cihazın işletim sistemi doğrulamasını kullanarak hızlı giriş sağlar. Ana şifrenizi güvenli bir yerde saklayın.'],
      ['Tüm verileri silince ne olur?', 'Kasa kayıtları, doğrulama bilgisi, biyometrik anahtar, ayarlar ve gizlilik onayı silinir. İşlem geri alınamaz.'],
    ];
  return (
    <ScrollView style={styles.privacyScroll} contentContainerStyle={styles.privacyCopy}>
      <View style={[styles.privacyIntro, { borderBottomColor: colors.border }]}>
        <Text style={[styles.infoEyebrow, { color: colors.primary }]}>FAQ</Text>
        <Text style={[styles.privacyLead, { color: colors.foreground }]}>{t('settings.faqLead')}</Text>
        <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>{t('settings.faqBody')}</Text>
      </View>
      {questions.map(([question, answer], index) => <FaqItem key={question} index={String(index + 1).padStart(2, '0')} question={question}>{answer}</FaqItem>)}
    </ScrollView>
  );
}

function PrivacyCard({ index, title, children }: { index: string; title: string; children: string }) {
  const colors = useColors();
  return (
    <View style={[styles.privacyCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary }]}>
      <Text style={[styles.infoIndex, { color: colors.primary }]}>{index}</Text>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.privacyHeading, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>{children}</Text>
      </View>
    </View>
  );
}

function FaqItem({ index, question, children }: { index: string; question: string; children: string }) {
  const colors = useColors();
  return (
    <View style={[styles.faqItem, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoIndex, { color: colors.primary }]}>{index}</Text>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{question}</Text>
        <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>{children}</Text>
      </View>
    </View>
  );
}

function SettingRow({ label, detail, icon, onPress, toggle, value, destructive }: { label: string; detail?: string; icon: keyof typeof Feather.glyphMap; onPress: () => void; toggle?: boolean; value?: boolean; destructive?: boolean }) {
  const colors = useColors();
  return <Pressable onPress={onPress} accessibilityRole={toggle ? 'switch' : 'button'} accessibilityLabel={label} accessibilityState={toggle ? { checked: value } : undefined} style={[styles.row, { borderBottomColor: colors.border, minHeight: colors.getTouchSize(57) }]}><Feather name={icon} size={18} color={destructive ? colors.destructive : colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.rowLabel, { color: destructive ? colors.destructive : colors.foreground, fontSize: colors.getTextSize(15) }]}>{label}</Text>{detail && <Text style={[styles.rowDetail, { color: colors.mutedForeground, fontSize: colors.getTextSize(12) }]}>{detail}</Text>}</View>{toggle ? <View style={[styles.switch, { backgroundColor: value ? colors.primary : colors.muted }]}><View style={[styles.knob, { backgroundColor: value ? colors.primaryForeground : colors.mutedForeground, alignSelf: value ? 'flex-end' : 'flex-start' }]} /></View> : <Feather name="chevron-right" size={17} color={colors.mutedForeground} />}</Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flexGrow: 1, paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  title: { fontSize: 20, fontWeight: '700' },
  groupTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3, marginTop: 12 },
  subsection: { fontSize: 14, fontWeight: '700', marginTop: 11, marginBottom: 9 },
  row: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDetail: { fontSize: 12, marginTop: 3 },
  switch: { width: 43, height: 25, borderRadius: 14, padding: 3 },
  knob: { width: 19, height: 19, borderRadius: 10 },
  passwordBox: { borderWidth: 1, borderRadius: 10, padding: 13, marginTop: 8, marginBottom: 5 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  textField: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  lockButton: { minHeight: 51, borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  lockText: { fontSize: 14, fontWeight: '700' },
  modeRow: { gap: 8, marginBottom: 8 },
  modeButton: { minHeight: 43, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  paletteSection: { marginTop: 2, marginBottom: 4 },
  paletteList: { gap: 8, paddingBottom: 8 },
  paletteCard: { width: 112, minHeight: 90, borderWidth: 1.5, borderRadius: 9, padding: 8, position: 'relative' },
  previewTop: { height: 31, borderRadius: 5, padding: 5, justifyContent: 'center', gap: 3 },
  previewLine: { height: 4, width: 40, borderRadius: 2 },
  previewLineShort: { height: 3, width: 25, borderRadius: 2 },
  previewAction: { width: 30, height: 6, borderRadius: 3, marginTop: 7 },
  paletteCheck: { position: 'absolute', right: 7, top: 7, width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  profileBox: { borderWidth: 1, borderRadius: 10, padding: 13, marginTop: 8, marginBottom: 4 },
  choiceList: { gap: 7, paddingBottom: 2 },
  choice: { minHeight: 35, paddingHorizontal: 10, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  saveProfile: { minHeight: 43, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  backupBox: { borderWidth: 1, borderRadius: 10, padding: 13, marginTop: 8, marginBottom: 5 },
  backupActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  backupButton: { flex: 1, minHeight: 43, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  backupButtonText: { fontSize: 13, fontWeight: '700' },
  backupHint: { fontSize: 12, lineHeight: 18, marginTop: -2 },
  inlineError: { fontSize: 12, lineHeight: 18, marginTop: 10, fontWeight: '600' },
  inlineMessage: { fontSize: 12, lineHeight: 18, marginTop: 10, fontWeight: '600' },
  deleteWarning: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  deleteActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelDeleteButton: { flex: 1, minHeight: 45, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { flex: 1, minHeight: 45, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 34, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { fontSize: 19, fontWeight: '700' },
  modalOption: { minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  privacyScroll: { maxHeight: 560 },
  privacyCopy: { gap: 10, paddingBottom: 10 },
  privacyIntro: { borderBottomWidth: 1, paddingBottom: 14, marginBottom: 2 },
  infoEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
  infoIndex: { width: 25, fontSize: 11, fontWeight: '700', letterSpacing: 0.4, paddingTop: 1 },
  privacyCard: { borderWidth: 1, borderLeftWidth: 2, borderRadius: 9, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  faqItem: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  faqQuestion: { fontSize: 13, lineHeight: 19, fontWeight: '700' },
  privacyLead: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
  privacySection: { gap: 6 },
  privacyHeading: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  privacyText: { fontSize: 12, lineHeight: 18 },
});