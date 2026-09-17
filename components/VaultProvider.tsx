import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import {
  createSalt,
  createVerifier,
  decryptVault,
  deriveKey,
  encryptVault,
  secureEqual,
} from '@/lib/crypto';
import { themePalettes, type PaletteId } from '@/constants/colors';
import { translate, type Language } from '@/lib/i18n';

export type Category = 'Banka' | 'E-posta' | 'Sosyal Medya' | 'Alışveriş' | 'Devlet' | 'İş' | 'Eğitim' | 'Oyun' | 'Abonelik' | 'Diğer';

export type VaultEntry = {
  id: string;
  name: string;
  username: string;
  password: string;
  website: string;
  note: string;
  category: Category;
  favorite: boolean;
  critical: boolean;
  updatedAt: string;
};

export type AppSettings = {
  language: Language;
  autoLock: 'immediately' | '30s' | '1' | '5' | '15' | '30' | 'never';
  biometric: boolean;
  lockOnOpen: boolean;
  hideSensitive: boolean;
  theme: 'system' | 'light' | 'dark';
  lightPalette: PaletteId;
  darkPalette: PaletteId;
  monochrome: boolean;
  textScale: 0.9 | 1 | 1.12;
  touchScale: 0.9 | 1 | 1.12;
  highContrast: boolean;
  simpleMode: boolean;
  name: string;
  surname: string;
  salutation: 'bey' | 'hanim' | 'none';
  greetingMode: 'automatic' | 'welcome' | 'hello' | 'selam' | 'allah' | 'custom';
  customGreeting: string;
  ignoredFindings: string[];
  privacyAcknowledgedAt: string | null;
};

type VaultContextValue = {
  ready: boolean;
  configured: boolean;
  resetSequence: number;
  locked: boolean;
  entries: VaultEntry[];
  settings: AppSettings;
  lastError: string | null;
  setup: (password: string, biometric: boolean, profile: Pick<AppSettings, 'name' | 'surname'>) => Promise<string | null>;
  unlock: (password: string) => Promise<string | null>;
  unlockBiometric: () => Promise<string | null>;
  lock: () => void;
  addEntry: (entry: Omit<VaultEntry, 'id' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, entry: Omit<VaultEntry, 'id' | 'updatedAt'>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  setBiometric: (enabled: boolean) => Promise<string | null>;
  changeMasterPassword: (current: string, next: string) => Promise<string | null>;
  wipeAllData: (password: string) => Promise<string | null>;
  exportBackup: (password: string) => Promise<string | null>;
  importBackup: (payload: string, password: string) => Promise<string | null>;
  copySensitive: (value: string, label: string) => Promise<void>;
  ignoreFinding: (findingId: string) => Promise<void>;
  clearIgnoredFindings: () => Promise<void>;
  clearError: () => void;
};

const DEFAULT_SETTINGS: AppSettings = {
  language: 'tr',
  autoLock: '1',
  biometric: false,
  lockOnOpen: true,
  hideSensitive: false,
  theme: 'system',
  lightPalette: 'minimal-purple',
  darkPalette: 'minimal-purple',
  monochrome: false,
  textScale: 1,
  touchScale: 1,
  highContrast: false,
  simpleMode: false,
  name: '',
  surname: '',
  salutation: 'none',
  greetingMode: 'automatic',
  customGreeting: '',
  ignoredFindings: [],
  privacyAcknowledgedAt: null,
};

function normalizeSettings(input: Partial<AppSettings>): AppSettings {
  const rawTextScale = Number(input.textScale);
  const rawTouchScale = Number(input.touchScale);
  const legacyTextScale = rawTextScale === 0.9 || rawTextScale === 1 || rawTextScale === 1.12
    ? rawTextScale
    : rawTextScale === 1.1 || rawTextScale === 1.2 ? 1.12 : 1;
  const legacyTouchScale = rawTouchScale === 0.9 || rawTouchScale === 1 || rawTouchScale === 1.12
    ? rawTouchScale
    : rawTouchScale === 1.14 ? 1.12 : 1;
  const autoLockValues: AppSettings['autoLock'][] = ['immediately', '30s', '1', '5', '15', '30', 'never'];
  const themeValues: AppSettings['theme'][] = ['system', 'light', 'dark'];
  const salutationValues: AppSettings['salutation'][] = ['bey', 'hanim', 'none'];
  const greetingValues: AppSettings['greetingMode'][] = ['automatic', 'welcome', 'hello', 'selam', 'allah', 'custom'];
  const lightPalette = typeof input.lightPalette === 'string' && Object.prototype.hasOwnProperty.call(themePalettes.light, input.lightPalette)
    ? input.lightPalette as PaletteId
    : DEFAULT_SETTINGS.lightPalette;
  const darkPalette = typeof input.darkPalette === 'string' && Object.prototype.hasOwnProperty.call(themePalettes.dark, input.darkPalette)
    ? input.darkPalette as PaletteId
    : DEFAULT_SETTINGS.darkPalette;
  return {
    ...DEFAULT_SETTINGS,
    language: input.language === 'en' ? 'en' : 'tr',
    autoLock: autoLockValues.includes(input.autoLock as AppSettings['autoLock']) ? input.autoLock as AppSettings['autoLock'] : DEFAULT_SETTINGS.autoLock,
    biometric: input.biometric === true,
    lockOnOpen: typeof input.lockOnOpen === 'boolean' ? input.lockOnOpen : DEFAULT_SETTINGS.lockOnOpen,
    hideSensitive: input.hideSensitive === true,
    theme: themeValues.includes(input.theme as AppSettings['theme']) ? input.theme as AppSettings['theme'] : DEFAULT_SETTINGS.theme,
    lightPalette,
    darkPalette,
    monochrome: input.monochrome === true,
    textScale: legacyTextScale as AppSettings['textScale'],
    touchScale: legacyTouchScale as AppSettings['touchScale'],
    highContrast: input.highContrast === true,
    simpleMode: input.simpleMode === true,
    name: typeof input.name === 'string' ? input.name : '',
    surname: typeof input.surname === 'string' ? input.surname : '',
    salutation: salutationValues.includes(input.salutation as AppSettings['salutation']) ? input.salutation as AppSettings['salutation'] : DEFAULT_SETTINGS.salutation,
    greetingMode: greetingValues.includes(input.greetingMode as AppSettings['greetingMode']) ? input.greetingMode as AppSettings['greetingMode'] : DEFAULT_SETTINGS.greetingMode,
    customGreeting: typeof input.customGreeting === 'string' ? input.customGreeting : '',
    ignoredFindings: Array.isArray(input.ignoredFindings) ? input.ignoredFindings.filter((value): value is string => typeof value === 'string') : [],
    privacyAcknowledgedAt: typeof input.privacyAcknowledgedAt === 'string' ? input.privacyAcknowledgedAt : null,
  };
}

const VALID_CATEGORIES: Category[] = ['Banka', 'E-posta', 'Sosyal Medya', 'Alışveriş', 'Devlet', 'İş', 'Eğitim', 'Oyun', 'Abonelik', 'Diğer'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeEntries(input: unknown): VaultEntry[] {
  if (!Array.isArray(input)) return [];
  const usedIds = new Set<string>();
  return input.flatMap((value, index) => {
    if (!isRecord(value) || typeof value.name !== 'string' || !value.name.trim() || typeof value.password !== 'string' || !value.password) return [];
    const baseId = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : `migrated-${index}`;
    let id = baseId;
    let suffix = 1;
    while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
    usedIds.add(id);
    const updatedAt = typeof value.updatedAt === 'string' && !Number.isNaN(Date.parse(value.updatedAt))
      ? value.updatedAt
      : new Date().toISOString();
    return [{
      id,
      name: value.name.trim(),
      username: typeof value.username === 'string' ? value.username : '',
      password: value.password,
      website: typeof value.website === 'string' ? value.website : '',
      note: typeof value.note === 'string' ? value.note : '',
      category: VALID_CATEGORIES.includes(value.category as Category) ? value.category as Category : 'Diğer',
      favorite: value.favorite === true,
      critical: value.critical === true,
      updatedAt,
    }];
  }).filter((entry) => entry.name.length > 0 && entry.password.length > 0);
}

const VaultContext = createContext<VaultContextValue | null>(null);
const MASTER_SALT = 'vault.master.salt';
const MASTER_VERIFIER = 'vault.master.verifier';
const VAULT_BLOB = 'vault.encrypted.blob';
const BIOMETRIC_KEY = 'vault.biometric.key';
const SETTINGS_KEY = 'vault.settings';

async function secureGet(name: string, options?: SecureStore.SecureStoreOptions) {
  if (Platform.OS === 'web') return AsyncStorage.getItem(`__secure__${name}`);
  return SecureStore.getItemAsync(name, options);
}

async function secureSet(name: string, value: string, options?: SecureStore.SecureStoreOptions) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(`__secure__${name}`, value);
    return;
  }
  await SecureStore.setItemAsync(name, value, options);
}

async function secureDelete(name: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(`__secure__${name}`);
    return;
  }
  await SecureStore.deleteItemAsync(name);
}

async function readSettings(): Promise<AppSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    return stored ? normalizeSettings(JSON.parse(stored) as Partial<AppSettings>) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [resetSequence, setResetSequence] = useState(0);
  const [locked, setLocked] = useState(true);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [key, setKey] = useState<Uint8Array | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [backgroundAt, setBackgroundAt] = useState<number | null>(null);
  const biometricInFlightRef = useRef(false);
  const wipeInFlightRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([secureGet(MASTER_SALT), secureGet(MASTER_VERIFIER), secureGet(VAULT_BLOB), readSettings()])
      .then(([salt, verifier, blob, storedSettings]) => {
        if (!mounted) return;
        setConfigured(Boolean(salt && verifier && blob));
        setSettings(storedSettings);
        setReady(true);
      })
      .catch(() => {
        if (mounted) {
          setLastError('Kasa bilgileri okunamadı. Lütfen uygulamayı yeniden açın.');
          setReady(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        setBackgroundAt(Date.now());
        return;
      }
      if (nextState === 'active' && backgroundAt !== null) {
        if (settings.autoLock === 'never') {
          setBackgroundAt(null);
          return;
        }
        const limit = settings.autoLock === 'immediately'
          ? 0
          : settings.autoLock === '30s'
            ? 30 * 1000
            : Number(settings.autoLock) * 60 * 1000;
        if (Date.now() - backgroundAt >= limit) lock();
        setBackgroundAt(null);
      }
    });
    return () => subscription.remove();
  }, [backgroundAt, settings.autoLock]);

  const persistVault = async (nextEntries: VaultEntry[], activeKey = key) => {
    if (!activeKey) throw new Error('Kasa kilitli');
    const safeEntries = normalizeEntries(nextEntries);
    const blob = await encryptVault(JSON.stringify(safeEntries), activeKey);
    await secureSet(VAULT_BLOB, blob);
    setEntries(safeEntries);
  };

  const setup = async (password: string, biometric: boolean, profile: Pick<AppSettings, 'name' | 'surname'>) => {
    if (!settings.privacyAcknowledgedAt) return translate(settings.language, 'error.privacyRequired');
    if (password.length < 8) return translate(settings.language, 'error.masterMin');
    try {
      const salt = await createSalt();
      const nextKey = await deriveKey(password, salt);
      const verifier = await createVerifier(password, salt);
      await secureSet(MASTER_SALT, salt);
      await secureSet(MASTER_VERIFIER, verifier);
      await secureSet(VAULT_BLOB, await encryptVault('[]', nextKey));
      let biometricEnabled = false;
      if (biometric && Platform.OS !== 'web') {
        const available = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (available && enrolled) {
          await secureSet(BIOMETRIC_KEY, Array.from(nextKey).join(','), {
            requireAuthentication: true,
            authenticationPrompt: translate(settings.language, 'native.biometricSetup'),
          });
          biometricEnabled = true;
        }
      }
      const nextSettings = { ...DEFAULT_SETTINGS, biometric: biometricEnabled, privacyAcknowledgedAt: settings.privacyAcknowledgedAt, ...profile };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
      setSettings(nextSettings);
      setEntries([]);
      setKey(nextKey);
      setConfigured(true);
      setLocked(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      return null;
    } catch {
      return translate(settings.language, 'error.setup');
    }
  };

  const loadWithKey = async (nextKey: Uint8Array) => {
    const blob = await secureGet(VAULT_BLOB);
    const parsed = blob ? JSON.parse(decryptVault(blob, nextKey)) as unknown : [];
    if (!Array.isArray(parsed)) throw new Error('Bozuk kasa verisi');
    setEntries(normalizeEntries(parsed));
    setKey(nextKey);
    setLocked(false);
  };

  const unlock = async (password: string) => {
    try {
      const salt = await secureGet(MASTER_SALT);
      const verifier = await secureGet(MASTER_VERIFIER);
      if (!salt || !verifier) return translate(settings.language, 'error.vaultMissing');
      const nextKey = await deriveKey(password, salt);
      const nextVerifier = await createVerifier(password, salt);
      if (!secureEqual(verifier, nextVerifier)) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
        return translate(settings.language, 'error.passwordWrong');
      }
      await loadWithKey(nextKey);
      setLastError(null);
      return null;
    } catch {
      return translate(settings.language, 'error.unlock');
    }
  };

  const unlockBiometric = async () => {
    if (Platform.OS === 'web') return translate(settings.language, 'error.biometricWeb');
    if (!settings.biometric) return translate(settings.language, 'error.biometricOff');
    if (biometricInFlightRef.current) return null;
    biometricInFlightRef.current = true;
    try {
      // The key was stored with requireAuthentication=true. Reading it is the
      // single native biometric prompt; calling authenticateAsync first would
      // cause a second prompt on iOS and some Android versions.
      const stored = await secureGet(BIOMETRIC_KEY);
       if (!stored) return translate(settings.language, 'error.biometricOff');
      await loadWithKey(new Uint8Array(stored.split(',').map(Number)));
      setLastError(null);
      return null;
    } catch {
      return translate(settings.language, 'error.biometricFail');
    } finally {
      biometricInFlightRef.current = false;
    }
  };

  const lock = () => {
    setKey((current) => {
      current?.fill(0);
      return null;
    });
    setEntries([]);
    setLocked(true);
  };

  const addEntry = async (entry: Omit<VaultEntry, 'id' | 'updatedAt'>) => {
    const nextEntry: VaultEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      updatedAt: new Date().toISOString(),
    };
    await persistVault([nextEntry, ...entries]);
  };

  const updateEntry = async (id: string, entry: Omit<VaultEntry, 'id' | 'updatedAt'>) => {
    await persistVault(entries.map((item) => item.id === id ? { ...item, ...entry, updatedAt: new Date().toISOString() } : item));
  };

  const deleteEntry = async (id: string) => {
    await persistVault(entries.filter((item) => item.id !== id));
  };

  const toggleFavorite = async (id: string) => {
    const nextEntries = entries.map((item) => item.id === id ? { ...item, favorite: !item.favorite, updatedAt: new Date().toISOString() } : item);
    await persistVault(nextEntries);
  };

  const updateSettings = async (patch: Partial<AppSettings>) => {
    const nextSettings = { ...settings, ...patch };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    setSettings(nextSettings);
  };

  const setBiometric = async (enabled: boolean) => {
    if (!enabled) {
      await secureDelete(BIOMETRIC_KEY);
      await updateSettings({ biometric: false });
      return null;
    }
    if (!key || Platform.OS === 'web') return translate(settings.language, 'error.biometricWeb');
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
       if (!available || !enrolled) return translate(settings.language, 'error.biometricDevice');
      await secureSet(BIOMETRIC_KEY, Array.from(key).join(','), {
        requireAuthentication: true,
        authenticationPrompt: translate(settings.language, 'native.biometricEnable'),
      });
      await updateSettings({ biometric: true });
      return null;
    } catch {
      return translate(settings.language, 'error.biometricEnable');
    }
  };

  const changeMasterPassword = async (current: string, next: string) => {
    if (next.length < 8) return translate(settings.language, 'error.masterNewMin');
    const salt = await secureGet(MASTER_SALT);
    if (!salt) return translate(settings.language, 'error.masterSaltMissing');
    const currentVerifier = await createVerifier(current, salt);
    const savedVerifier = await secureGet(MASTER_VERIFIER);
    if (!savedVerifier || !secureEqual(savedVerifier, currentVerifier)) return translate(settings.language, 'error.masterCurrentWrong');
    const previousSalt = salt;
    const previousVerifier = savedVerifier;
    const previousBlob = await secureGet(VAULT_BLOB);
    try {
      const nextSalt = await createSalt();
      const nextKey = await deriveKey(next, nextSalt);
      const nextVerifier = await createVerifier(next, nextSalt);
      const nextBlob = await encryptVault(JSON.stringify(entries), nextKey);
      await secureSet(MASTER_SALT, nextSalt);
      await secureSet(MASTER_VERIFIER, nextVerifier);
      await secureSet(VAULT_BLOB, nextBlob);
      if (settings.biometric && Platform.OS !== 'web') {
        await secureSet(BIOMETRIC_KEY, Array.from(nextKey).join(','), {
          requireAuthentication: true,
        authenticationPrompt: translate(settings.language, 'native.biometricReenable'),
        });
      }
      setKey(nextKey);
      return null;
    } catch {
      await Promise.all([
        secureSet(MASTER_SALT, previousSalt),
        secureSet(MASTER_VERIFIER, previousVerifier),
        previousBlob ? secureSet(VAULT_BLOB, previousBlob) : secureDelete(VAULT_BLOB),
      ]).catch(() => undefined);
      return translate(settings.language, 'error.masterChange');
    }
  };

  const wipeAllData = async (password: string) => {
    if (wipeInFlightRef.current) return translate(settings.language, 'error.deleteInProgress');
    wipeInFlightRef.current = true;
    try {
      const salt = await secureGet(MASTER_SALT);
      const verifier = await secureGet(MASTER_VERIFIER);
      if (!salt || !verifier) return translate(settings.language, 'error.vaultMissing');
      const candidate = await createVerifier(password, salt);
      if (!secureEqual(verifier, candidate)) return translate(settings.language, 'error.deleteWrong');
      if (Platform.OS !== 'web' && settings.biometric) {
        const authentication = await LocalAuthentication.authenticateAsync({
          promptMessage: translate(settings.language, 'native.deletePrompt'),
          cancelLabel: translate(settings.language, 'native.cancel'),
          disableDeviceFallback: true,
        });
        if (!authentication.success) return translate(settings.language, 'error.deleteBiometric');
      }
      await Promise.all([
        secureDelete(MASTER_SALT),
        secureDelete(MASTER_VERIFIER),
        secureDelete(VAULT_BLOB),
        secureDelete(BIOMETRIC_KEY),
        AsyncStorage.removeItem(SETTINGS_KEY),
      ]);
      setKey((current) => {
        current?.fill(0);
        return null;
      });
      setEntries([]);
      setSettings(DEFAULT_SETTINGS);
      setConfigured(false);
      setLocked(true);
      setResetSequence((current) => current + 1);
      setLastError(null);
      return null;
    } catch {
      return translate(settings.language, 'error.deleteFailed');
    } finally {
      wipeInFlightRef.current = false;
    }
  };

  const exportBackup = async (password: string) => {
    if (password.length < 8) return translate(settings.language, 'error.backupMin');
    try {
      const salt = await createSalt();
      const backupKey = await deriveKey(password, salt);
      const blob = await encryptVault(JSON.stringify(entries), backupKey);
      return `${salt}.${blob}`;
    } catch {
      return translate(settings.language, 'error.backupCreate');
    }
  };

  const importBackup = async (payload: string, password: string) => {
    if (password.length < 8) return translate(settings.language, 'error.backupMin');
    try {
      const separator = payload.indexOf('.');
      if (separator < 1) return translate(settings.language, 'error.backupNotRecognized');
      const salt = payload.slice(0, separator);
      const blob = payload.slice(separator + 1);
      const backupKey = await deriveKey(password, salt);
      const restored = JSON.parse(decryptVault(blob, backupKey)) as unknown;
      if (!Array.isArray(restored)) return translate(settings.language, 'error.backupInvalid');
      const safeEntries = normalizeEntries(restored);
      if (safeEntries.length !== restored.length) return translate(settings.language, 'error.backupInvalid');
      await persistVault(safeEntries);
      return null;
    } catch {
      return translate(settings.language, 'error.backupRestore');
    }
  };

  const copySensitive = async (value: string, label: string) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setTimeout(() => {
      void Clipboard.setStringAsync('');
      setLastError(translate(settings.language, 'clipboard.cleared', { label }));
    }, 30000);
    setLastError(translate(settings.language, 'clipboard.copied', { label }));
  };

  const ignoreFinding = async (findingId: string) => {
    if (settings.ignoredFindings.includes(findingId)) return;
    await updateSettings({ ignoredFindings: [...settings.ignoredFindings, findingId] });
  };

  const clearIgnoredFindings = async () => {
    await updateSettings({ ignoredFindings: [] });
  };

  const value = useMemo<VaultContextValue>(() => ({
    ready, configured, resetSequence, locked, entries, settings, lastError,
    setup, unlock, unlockBiometric, lock, addEntry, updateEntry, deleteEntry,
    toggleFavorite, updateSettings, setBiometric, changeMasterPassword, wipeAllData,
    exportBackup, importBackup, copySensitive, ignoreFinding, clearIgnoredFindings,
    clearError: () => setLastError(null),
  }), [ready, configured, resetSequence, locked, entries, settings, lastError, key]);

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault VaultProvider içinde kullanılmalı');
  return context;
}