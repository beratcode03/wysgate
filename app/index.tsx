import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AppSettings, Category, useVault, VaultEntry } from '@/components/VaultProvider';
import { analyzeVault } from '@/lib/security';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useI18n } from '@/lib/i18n';

const CATEGORIES: Category[] = ['Banka', 'E-posta', 'Sosyal Medya', 'Alışveriş', 'Devlet', 'İş', 'Eğitim', 'Oyun', 'Abonelik', 'Diğer'];

function getGreeting(settings: AppSettings, language: 'tr' | 'en') {
  const name = settings.name.trim();
  const person = language === 'en'
    ? `${settings.salutation === 'bey' ? 'Mr. ' : settings.salutation === 'hanim' ? 'Ms. ' : ''}${name}`.trim()
    : `${name}${settings.salutation === 'bey' ? ' Bey' : settings.salutation === 'hanim' ? ' Hanım' : ''}`.trim();
  if (settings.greetingMode === 'custom' && settings.customGreeting.trim()) return settings.customGreeting.replaceAll('{ad}', person).replaceAll('{name}', person);
  if (settings.greetingMode === 'welcome') return language === 'en' ? `Welcome${person ? ` ${person}` : ''}.` : `Hoş geldiniz${person ? ` ${person}` : ''}.`;
  if (settings.greetingMode === 'hello') return language === 'en' ? `Hello${person ? ` ${person}` : ''}.` : `Merhaba${person ? ` ${person}` : ''}.`;
  if (settings.greetingMode === 'selam') return language === 'en' ? `Hi${person ? ` ${person}` : ''}.` : `Selam${person ? ` ${person}` : ''}.`;
  if (settings.greetingMode === 'allah') return language === 'en' ? `Welcome${person ? ` ${person}` : ''}.` : `Allah'ın selamı üzerinize olsun${person ? ` ${person}` : ''}.`;
  const hour = new Date().getHours();
  const timeGreeting = language === 'en'
    ? hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  return `${timeGreeting}${person ? ` ${person}` : ''}.`;
}

function LogoMark({ small = false, large = false }: { small?: boolean; large?: boolean }) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <View style={[styles.logoMark, small && styles.logoMarkSmall]} accessibilityLabel={t('brand.manager')}>
      <Image
        source={require('@/assets/images/W.png')}
        accessibilityLabel={t('accessibility.brandMark')}
        resizeMode="contain"
        tintColor={colors.primary}
        style={[styles.brandMark, { width: small ? 54 : large ? 168 : 82, height: small ? 34 : large ? 106 : 52 }]}
      />
    </View>
  );
}

function Wordmark({ large = false }: { large?: boolean }) {
  const colors = useColors();
  const { t } = useI18n();
  return <Image source={require('@/assets/images/wysteria.png')} accessibilityLabel={t('accessibility.brandMark')} resizeMode="contain" tintColor={colors.foreground} style={[styles.wordmark, large && styles.launchWordmark]} />;
}

function StepProgress({ current }: { current: 1 | 2 }) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <View style={styles.progressRow} accessibilityLabel={t('accessibility.setupStep', { current })}>
      <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>{current} / 2</Text>
      <View style={styles.progressTrack}>
        {[1, 2].map((step) => <View key={step} style={[styles.progressDot, { backgroundColor: step <= current ? colors.primary : colors.muted }]} />)}
      </View>
    </View>
  );
}

function LoadingScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const entrance = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const animation = Animated.timing(entrance, { toValue: 1, duration: 420, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    const startedAt = Date.now();
    const counter = setInterval(() => {
      setProgress(Math.min(100, Math.round(((Date.now() - startedAt) / 2600) * 100)));
    }, 32);
    return () => {
      animation.stop();
      clearInterval(counter);
    };
  }, [entrance]);
  return (
    <ScreenShell scroll={false} footer={<BrandFooter />}>
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Animated.View style={{ opacity: entrance, transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }] }}>
          <View style={styles.launchBrand}>
            <LogoMark large />
            <Wordmark large />
            <View style={styles.launchProgress}>
              <Text style={[styles.launchPercent, { color: colors.primary }]}>%{progress}</Text>
              <View style={[styles.launchTrack, { backgroundColor: colors.muted }]}>
                <Animated.View style={[styles.launchFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.launchCaption, { color: colors.mutedForeground }]}>{t('launch.caption')}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </ScreenShell>
  );
}

export function BrandFooter() {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <View style={styles.brandFooter}>
      <Text style={[styles.brandFooterName, { color: colors.foreground }]}>{t('brand.manager')}</Text>
      <Text style={[styles.versionFooter, { color: colors.mutedForeground }]}>{t('brand.version')}</Text>
    </View>
  );
}

function ScreenShell({ children, scroll = true, footer }: { children: React.ReactNode; scroll?: boolean; footer?: React.ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const contentStyle = { paddingTop: insets.top + 18, paddingBottom: insets.bottom + (footer ? 92 : 22) };
  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      {scroll ? (
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={[styles.screen, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </KeyboardAwareScrollViewCompat>
      ) : (
        <View style={[styles.screen, contentStyle]}>{children}</View>
      )}
      {footer}
    </View>
  );
}

function SetupScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { setup, lastError, clearError } = useVault();
  const [step, setStep] = useState<'profile' | 'password'>('profile');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [biometric, setBiometric] = useState(Platform.OS !== 'web');
  const [error, setError] = useState('');
  const strength = password.length >= 12 ? t('setup.strong') : password.length >= 8 ? t('setup.medium') : t('setup.weak');
  const submit = async () => {
    clearError();
    if (password !== confirm) {
      setError(t('setup.passwordMismatch'));
      return;
    }
    const result = await setup(password, biometric, { name: name.trim(), surname: surname.trim() });
    if (result) setError(result);
  };
  if (step === 'profile') {
    return (
      <ScreenShell footer={<BrandFooter />}>
        <View style={styles.setupWrap}>
          <>
          <StepProgress current={1} />
          <LogoMark />
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('setup.eyebrow')}</Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>{t('setup.profileTitle')}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{t('setup.profileBody')}</Text>
          <Field label={t('setup.name')} value={name} onChangeText={setName} placeholder={t('setup.name')} />
          <Field label={t('setup.surname')} value={surname} onChangeText={setSurname} placeholder={t('setup.surname')} />
          <PrimaryButton label={t('setup.continue')} onPress={() => {
            if (!name.trim() || !surname.trim()) setError(t('setup.requiredProfile'));
            else { setError(''); setStep('password'); }
          }} />
          {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>{t('setup.localNote')}</Text>
          </>
        </View>
      </ScreenShell>
    );
  }
  return (
    <ScreenShell footer={<BrandFooter />}>
      <View style={styles.setupWrap}>
        <>
        <StepProgress current={2} />
        <LogoMark />
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('setup.eyebrow')}</Text>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>{t('setup.passwordTitle')}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{t('setup.passwordBody')}</Text>
        <View style={[styles.notice, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.accentForeground }]}>{t('setup.passwordWarning')}</Text>
        </View>
        <Field label={t('setup.masterPassword')} value={password} onChangeText={setPassword} secureTextEntry={!show} rightIcon={show ? 'eye-off' : 'eye'} onRightPress={() => setShow(!show)} placeholder={t('setup.passwordPlaceholder')} />
        <Field label={t('setup.confirmPassword')} value={confirm} onChangeText={setConfirm} secureTextEntry={!show} placeholder={t('setup.confirmPlaceholder')} />
        {password.length > 0 && <Text style={[styles.helper, { color: strength === t('setup.strong') ? colors.success : colors.warning }]}>{t('setup.strength')}: {strength}</Text>}
        <Pressable onPress={() => setBiometric(!biometric)} style={styles.checkRow}>
          <View style={[styles.checkbox, { borderColor: biometric ? colors.primary : colors.border, backgroundColor: biometric ? colors.primary : 'transparent' }]}>{biometric && <Feather name="check" size={14} color={colors.primaryForeground} />}</View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>{t('setup.biometric')}</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('setup.biometricBody')}</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setStep('profile')} style={styles.backSetup}><Feather name="arrow-left" size={15} color={colors.primary} /><Text style={[styles.link, { color: colors.primary }]}>{t('setup.changeProfile')}</Text></Pressable>
        {(error || lastError) && <Text style={[styles.error, { color: colors.destructive }]}>{error || lastError}</Text>}
        <PrimaryButton label={t('setup.createVault')} onPress={submit} />
        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>{t('setup.noSharing')}</Text>
        </>
      </View>
    </ScreenShell>
  );
}

function PrivacyOnboardingScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { settings, updateSettings } = useVault();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(false);
  }, [settings.privacyAcknowledgedAt]);

  const continueSetup = async () => {
    if (!accepted) return;
    await updateSettings({ privacyAcknowledgedAt: new Date().toISOString() });
  };

  return (
    <ScreenShell scroll={false} footer={<BrandFooter />}>
      <View style={styles.privacyOnboarding}>
        <LogoMark />
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('privacy.eyebrow')}</Text>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>{t('privacy.title')}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{t('privacy.intro')}</Text>
        <ScrollView
          style={[styles.privacyOnboardingScroll, { borderColor: colors.border, backgroundColor: colors.card }]}
          contentContainerStyle={styles.privacyOnboardingCopy}
          showsVerticalScrollIndicator
          nestedScrollEnabled
        >
          <PrivacyInfoBlock index="01" title={t('privacy.localTitle')}>{t('privacy.localBody')}</PrivacyInfoBlock>
          <PrivacyInfoBlock index="02" title={t('privacy.vaultTitle')}>{t('privacy.vaultBody')}</PrivacyInfoBlock>
          <PrivacyInfoBlock index="03" title={t('privacy.lockTitle')}>{t('privacy.lockBody')}</PrivacyInfoBlock>
          <PrivacyInfoBlock index="04" title={t('privacy.limitsTitle')}>{t('privacy.limitsBody')}</PrivacyInfoBlock>
          <PrivacyInfoBlock index="05" title={t('privacy.platformTitle')}>{t('privacy.platformBody')}</PrivacyInfoBlock>
        </ScrollView>
        <Pressable
          onPress={() => setAccepted((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          style={styles.checkRow}
        >
          <View style={[styles.checkbox, { borderColor: accepted ? colors.primary : colors.border, backgroundColor: accepted ? colors.primary : 'transparent' }]}>
            {accepted && <Feather name="check" size={14} color={colors.primaryForeground} />}
          </View>
          <Text style={[styles.label, { color: colors.foreground, flex: 1 }]}>{t('privacy.accept')}</Text>
        </Pressable>
        <PrimaryButton label={t('privacy.continue')} onPress={continueSetup} disabled={!accepted} />
      </View>
    </ScreenShell>
  );
}

function PrivacyInfoBlock({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.privacyOnboardingBlock, { borderLeftColor: colors.primary }]}>
      <Text style={[styles.privacyIndex, { color: colors.primary }]}>{index}</Text>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.privacyBlockTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.privacyBlockText, { color: colors.mutedForeground }]}>{children}</Text>
      </View>
    </View>
  );
}

function LockScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { unlock, unlockBiometric, settings, lastError, clearError } = useVault();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const submit = async () => {
    clearError();
    const result = await unlock(password);
    if (result) setError(result);
  };
  const biometric = async () => {
    if (authenticating) return;
    setAuthenticating(true);
    try {
      const result = await unlockBiometric();
      if (result) setError(result);
    } finally {
      setAuthenticating(false);
    }
  };
  return (
    <ScreenShell footer={<BrandFooter />}>
      <View style={styles.lockWrap}>
         <LogoMark large />
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>{t('lock.title')}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{t('lock.body')}</Text>
        <Field label={t('setup.masterPassword')} value={password} onChangeText={setPassword} secureTextEntry={!show} rightIcon={show ? 'eye-off' : 'eye'} onRightPress={() => setShow(!show)} onSubmitEditing={submit} placeholder={t('lock.passwordPlaceholder')} />
        {(error || lastError) && <Text style={[styles.error, { color: colors.destructive }]}>{error || lastError}</Text>}
        <PrimaryButton label={t('lock.unlock')} onPress={submit} />
        {settings.biometric && (
          <Pressable disabled={authenticating} onPress={biometric} accessibilityLabel={t('accessibility.biometric')} style={({ pressed }) => [styles.biometricButton, { borderColor: colors.border, opacity: authenticating ? 0.5 : pressed ? 0.7 : 1 }]}>
             <MaterialCommunityIcons name="fingerprint" size={26} color={colors.primary} />
            <Text style={[styles.buttonText, { color: colors.primary }]}>{authenticating ? t('lock.biometricWaiting') : t('lock.biometricOpen')}</Text>
          </Pressable>
        )}
        <View style={[styles.lockHint, { backgroundColor: colors.muted }]}>
          <Feather name="clock" size={16} color={colors.mutedForeground} />
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('lock.hint')}</Text>
        </View>
      </View>
    </ScreenShell>
  );
}

function VaultHome() {
  const colors = useColors();
  const { t, categoryLabel: labelCategory } = useI18n();
  const { entries, settings, lock, toggleFavorite, copySensitive, lastError, clearError } = useVault();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Category | 'Tümü'>('Tümü');
  const filtered = useMemo(() => entries.filter((entry) => {
    const matchesQuery = `${entry.name} ${entry.username} ${entry.website}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'));
    return matchesQuery && (selected === 'Tümü' || entry.category === selected);
  }), [entries, query, selected]);
  const recent = filtered.slice(0, 4);
  const favoriteCount = entries.filter((entry) => entry.favorite).length;
  const analysis = analyzeVault(entries);
  const visibleCategories = settings.simpleMode ? CATEGORIES.slice(0, 5) : CATEGORIES;
  const greeting = getGreeting(settings, settings.language);
  const findingCount = analysis.weak.length + analysis.reused.length + analysis.old.length;
  const securitySummary = findingCount === 0 ? t('home.safe') : `${findingCount} ${t('home.review')}`;
  return (
    <ScreenShell footer={<VaultTabBar />}>
      <View style={styles.homeHeader}>
        <Wordmark />
        <Pressable onPress={lock} accessibilityLabel={t('accessibility.lock')} style={({ pressed }) => [styles.lockButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.65 : 1 }]}>
          <Feather name="lock" size={17} color={colors.foreground} />
        </Pressable>
      </View>
      <View style={styles.homeIntro}>
        <Text style={[styles.greeting, { color: colors.foreground, fontSize: colors.getTextSize(17) }]}>{greeting}</Text>
        <Text style={[styles.vaultSummary, { color: colors.mutedForeground, fontSize: colors.getTextSize(13) }]}>{entries.length} {t('home.entryWord')} <Text style={{ color: colors.border }}>•</Text> {securitySummary}</Text>
      </View>
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={19} color={colors.mutedForeground} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t('home.search')} placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground, fontSize: 16 * settings.textScale }]} />
        {query.length > 0 && <Pressable onPress={() => setQuery('')}><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable>}
      </View>
      <Pressable onPress={() => router.push('/new')} accessibilityLabel={t('accessibility.addPassword')} style={({ pressed }) => [styles.newButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}>
        <Feather name="plus" size={18} color={colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{t('home.new')}</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/generator')} style={({ pressed }) => [styles.generatorLink, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
        <Feather name="key" size={16} color={colors.primary} />
        <Text style={[styles.generatorText, { color: colors.primary }]}>{t('home.generator')}</Text>
        <Feather name="arrow-up-right" size={15} color={colors.primary} />
      </Pressable>
      {lastError && <Pressable onPress={clearError} style={[styles.toast, { backgroundColor: colors.accent }]}><Feather name="check-circle" size={16} color={colors.primary} /><Text style={[styles.caption, { color: colors.accentForeground, flex: 1 }]}>{lastError}</Text><Feather name="x" size={16} color={colors.accentForeground} /></Pressable>}
      <View style={[styles.navigationGroup, { borderTopColor: colors.border }]}>
        <HomeNavigationRow
          icon={<Feather name="shield" size={18} color={findingCount ? colors.warning : colors.success} />}
          title={t('home.security')}
          subtitle={securitySummary}
          onPress={() => router.push('/security')}
        />
        <HomeNavigationRow
          icon={<MaterialCommunityIcons name={favoriteCount > 0 ? 'bookmark' : 'bookmark-outline'} size={19} color={colors.warning} />}
          title={t('home.favorites')}
          subtitle={`${favoriteCount} ${t('home.entryWord')}`}
          onPress={() => router.push('/vault?filter=favorites')}
          last
        />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.categories')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
        {(['Tümü', ...visibleCategories] as const).map((category) => (
          <Pressable key={category} onPress={() => setSelected(category)} style={[styles.chip, { backgroundColor: selected === category ? colors.primary : colors.card, borderColor: selected === category ? colors.primary : colors.border }]}>
            <Text style={[styles.chipText, { color: selected === category ? colors.primaryForeground : colors.mutedForeground }]}>{labelCategory(category)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.sectionHeader}>
         <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{query || selected !== 'Tümü' ? t('home.results') : t('home.recent')}</Text>
         <Text style={[styles.countText, { color: colors.mutedForeground }]}>{filtered.length} {t('home.entryWord')}</Text>
      </View>
      {recent.length === 0 ? (
        <View style={styles.empty}>
          {query ? <Feather name="search" size={22} color={colors.mutedForeground} /> : <Image source={require('@/assets/images/W.png')} resizeMode="contain" tintColor={colors.primary} style={styles.emptyMark} />}
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{query ? t('home.noResults') : t('home.emptyTitle')}</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground, textAlign: 'center' }]}>{query ? t('home.tryAnother') : t('home.emptyBody')}</Text>
        </View>
      ) : recent.map((entry) => <EntryRow key={entry.id} entry={entry} onFavorite={() => toggleFavorite(entry.id)} onPress={() => router.push(`/entry/${entry.id}`)} onCopy={() => copySensitive(entry.password, t('entry.password'))} />)}
      {entries.length > 4 && <Pressable onPress={() => setSelected('Tümü')}><Text style={[styles.link, { color: colors.primary }]}>{t('home.showAll')}</Text></Pressable>}
    </ScreenShell>
  );
}

export function VaultTabBar() {
  const colors = useColors();
  const { t } = useI18n();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const items: Array<{ label: string; icon: keyof typeof Feather.glyphMap; route: '/' | '/vault' | '/new' | '/security' | '/settings' }> = [
    { label: t('nav.home'), icon: 'home', route: '/' },
    { label: t('nav.passwords'), icon: 'archive', route: '/vault' },
    { label: t('nav.create'), icon: 'plus', route: '/new' },
    { label: t('nav.security'), icon: 'shield', route: '/security' },
    { label: t('nav.settings'), icon: 'settings', route: '/settings' },
  ];
  const isActive = (route: typeof items[number]['route']) => route === '/' ? pathname === '/' : pathname.startsWith(route);
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 6) }]}>
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          onPress={() => {
            const active = isActive(item.route);
            if (active) return;
            router.replace(item.route);
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: item.route === '/' ? pathname === '/' : pathname.startsWith(item.route) }}
          accessibilityLabel={item.label}
          style={({ pressed }) => [styles.tabItem, index === 2 && styles.actionTab, { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.97 : 1 }], minHeight: colors.getTouchSize(65, 60) }]}
        >
            {index === 2 ? (
              <View style={[styles.centerAction, { backgroundColor: colors.primary }]}>
                <Feather name={item.icon} size={19} color={colors.primaryForeground} />
              </View>
            ) : (
              <View style={styles.tabIcon}>
                <Feather name={item.icon} size={18} color={isActive(item.route) ? colors.primary : colors.mutedForeground} />
              </View>
            )}
          <Text style={[styles.tabLabel, { color: isActive(item.route) ? colors.primary : colors.mutedForeground, fontSize: colors.getTextSize(10) }, index === 2 && styles.actionLabel]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function HomeNavigationRow({ icon, title, subtitle, onPress, last = false }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void; last?: boolean }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navigationRow, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }, { opacity: pressed ? 0.65 : 1 }]}>
      <View style={styles.navigationIcon}>{icon}</View>
      <View style={styles.navigationCopy}>
        <Text style={[styles.securityTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <View style={styles.navigationAction}><Feather name="chevron-right" size={17} color={colors.mutedForeground} /></View>
    </Pressable>
  );
}

function EntryRow({ entry, onPress, onFavorite, onCopy }: { entry: VaultEntry; onPress: () => void; onFavorite: () => void; onCopy: () => void }) {
  const colors = useColors();
  const { t, categoryLabel } = useI18n();
  return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.entryRow, { borderBottomColor: colors.border, opacity: pressed ? 0.64 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
      <View style={[styles.entryIcon, { backgroundColor: colors.accent }]}><Text style={[styles.entryInitial, { color: colors.primary }]}>{entry.name.slice(0, 1).toUpperCase()}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.entryName, { color: colors.foreground }]} numberOfLines={1}>{entry.name}</Text>
         <Text style={[styles.entryMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{entry.username || t('entry.usernameMissing')} · {categoryLabel(entry.category)}</Text>
      </View>
       <Pressable onPress={(event) => { event.stopPropagation(); onCopy(); }} hitSlop={10}><Feather name="copy" size={17} color={colors.mutedForeground} /></Pressable>
       <Pressable onPress={onFavorite} hitSlop={10} style={{ marginLeft: 13 }}><MaterialCommunityIcons name={entry.favorite ? 'bookmark' : 'bookmark-outline'} size={19} color={entry.favorite ? colors.warning : colors.mutedForeground} /></Pressable>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={{ marginLeft: 9 }} />
    </Pressable>
  );
}

function Field({ label, value, onChangeText, secureTextEntry, rightIcon, onRightPress, placeholder, onSubmitEditing }: { label: string; value: string; onChangeText: (value: string) => void; secureTextEntry?: boolean; rightIcon?: keyof typeof Feather.glyphMap; onRightPress?: () => void; placeholder?: string; onSubmitEditing?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground, fontSize: 14 * colors.textScale }]}>{label}</Text>
      <View style={[styles.inputShell, { backgroundColor: colors.card, borderColor: colors.input }]}>
        <TextInput value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} autoCapitalize="none" style={[styles.input, { color: colors.foreground, fontSize: 16 * colors.textScale }]} onSubmitEditing={onSubmitEditing} />
        {rightIcon && onRightPress && <Pressable onPress={onRightPress} hitSlop={10}><Feather name={rightIcon} size={18} color={colors.mutedForeground} /></Pressable>}
      </View>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const colors = useColors();
  return <Pressable disabled={disabled} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, minHeight: colors.getTouchSize(54), opacity: disabled ? 0.45 : pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><Text style={[styles.buttonText, { color: colors.primaryForeground, fontSize: colors.getTextSize(15) }]}>{label}</Text></Pressable>;
}

export default function Index() {
  const { ready, configured, locked, settings } = useVault();
  if (!ready) return <LoadingScreen />;
  if (!settings.privacyAcknowledgedAt) return <PrivacyOnboardingScreen />;
  if (!configured) return <SetupScreen />;
  if (locked) return <LockScreen />;
  return <VaultHome />;
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  screen: { flexGrow: 1, paddingHorizontal: 20 },
   setupWrap: { paddingVertical: 10 },
  lockWrap: { flex: 1, justifyContent: 'center', paddingVertical: 40 },
    privacyOnboarding: { flex: 1, paddingVertical: 8 },
    privacyOnboardingScroll: { flex: 1, minHeight: 180, borderWidth: 1, borderRadius: 14 },
   privacyOnboardingCopy: { padding: 14, gap: 15 },
    privacyOnboardingBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderLeftWidth: 2, paddingLeft: 10 },
    privacyIndex: { width: 24, fontSize: 11, fontWeight: '700', letterSpacing: 0.4, paddingTop: 1 },
   privacyBlockTitle: { fontSize: 14, fontWeight: '700' },
   privacyBlockText: { fontSize: 12, lineHeight: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  launchBrand: { alignItems: 'center', justifyContent: 'center', minWidth: 270 },
  launchProgress: { width: 250, alignItems: 'center', gap: 11, marginTop: 22 },
  launchPercent: { fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  launchTrack: { width: '100%', height: 7, borderRadius: 4, overflow: 'hidden' },
  launchFill: { height: '100%', borderRadius: 4 },
  launchCaption: { fontSize: 12, letterSpacing: 0.3 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 26 },
  progressLabel: { fontSize: 12, fontWeight: '700' },
  progressTrack: { flexDirection: 'row', gap: 5 },
  progressDot: { width: 28, height: 4, borderRadius: 2 },
  logoMark: { alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  logoMarkSmall: { marginBottom: 0 },
  brandMark: { opacity: 0.96 },
  wordmark: { width: 202, height: 58, marginTop: -2, marginBottom: 6 },
  launchWordmark: { width: 278, height: 80 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, marginBottom: 10 },
  heroTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.7, marginBottom: 13, maxWidth: 340 },
  pageTitle: { fontSize: 30, lineHeight: 35, fontWeight: '700', letterSpacing: -0.6 },
  body: { fontSize: 16, lineHeight: 24, marginBottom: 22, maxWidth: 360 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 24 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  field: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputShell: { minHeight: 54, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  input: { flex: 1, fontSize: 16, paddingVertical: 13 },
  helper: { fontSize: 13, fontWeight: '600', marginTop: -5, marginBottom: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 7, marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  caption: { fontSize: 13, lineHeight: 19 },
   brandFooter: { marginTop: 22, paddingTop: 0, paddingBottom: 8, alignItems: 'center', width: '100%', paddingHorizontal: 4 },
  brandFooterName: { textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  versionFooter: { alignSelf: 'flex-end', fontSize: 10, marginTop: 8, paddingRight: 2 },
  greeting: { fontSize: 14, lineHeight: 20, marginBottom: 2, textAlign: 'center' },
  error: { fontSize: 13, lineHeight: 19, marginBottom: 12, fontWeight: '600' },
  footerNote: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 18 },
  primaryButton: { minHeight: 54, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 6 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  biometricButton: { minHeight: 54, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 12 },
  lockHint: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 9, marginTop: 28 },
  homeHeader: { minHeight: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 6, position: 'relative' },
  homeIntro: { marginBottom: 18 },
  vaultSummary: { marginTop: 5, lineHeight: 19 },
  lockButton: { position: 'absolute', right: 0, top: 16, width: 40, height: 40, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchBox: { minHeight: 52, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, paddingVertical: 11 },
  toast: { marginTop: 12, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  newButton: { minHeight: 50, borderRadius: 11, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 13, marginBottom: 9 },
  generatorLink: { minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22 },
  generatorText: { fontSize: 13, fontWeight: '700', flex: 1 },
  navigationGroup: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 25 },
  navigationRow: { minHeight: 66, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  navigationIcon: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  navigationCopy: { flex: 1 },
  navigationAction: { width: 24, alignItems: 'flex-end', justifyContent: 'center' },
  securityTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 11 },
  chipList: { gap: 8, paddingBottom: 26, paddingRight: 8 },
  chip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  countText: { fontSize: 12 },
  entryRow: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 2 },
  entryIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  entryInitial: { fontSize: 16, fontWeight: '700' },
  entryName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  entryMeta: { fontSize: 12 },
   empty: { alignItems: 'center', justifyContent: 'center', minHeight: 142, paddingHorizontal: 20, paddingVertical: 22, gap: 7 },
  emptyMark: { width: 68, height: 46, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 14, fontWeight: '700', paddingVertical: 10 },
  backSetup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 8 },
   tabBar: { minHeight: 72, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-around', paddingHorizontal: 4 },
   tabItem: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 3 },
   actionTab: { justifyContent: 'center' },
   tabIcon: { minWidth: 38, minHeight: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
   centerAction: { width: 40, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  actionLabel: { fontWeight: '700' },
});