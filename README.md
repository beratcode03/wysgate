# Wysgate

Wysgate is a local-first password manager built with Expo and React Native. The vault is encrypted before it is written to storage, the master password is never persisted as plain text, and the application does not require a hosted account or a central password database.

## Türkçe

Wysgate, kayıtları öncelikle kullanıcının cihazında tutan yerel öncelikli bir parola yöneticisidir. Uygulama; şifreli kasa, ana şifre, biyometrik kilit açma, otomatik kilit, güçlü parola üreticisi, güvenlik merkezi, favoriler, kategoriler ve şifreli yedek akışlarını tek bir mobil arayüzde sunar.

### Özellikler

- Ana şifre ile korunan, şifreli yerel kasa
- İlk kullanımda numaralı gizlilik ve güvenlik bilgilendirmesi
- Android ve iOS cihazlarında işletim sistemi biyometrisi
- Uygulama arka plana alındığında otomatik kilit
- Güçlü parola üreticisi ve panoya kopyalama
- Zayıf, tekrar kullanılan ve uzun süredir değişmeyen parola analizi
- Arama, kategori, favori ve kritik hesap işaretleri
- Ayrı yedek şifresiyle şifreli dışa aktarma ve geri yükleme
- Açık/koyu tema, paletler, monokrom görünüm, kontrast, yazı ve dokunma boyutu
- Türkçe ve English arayüz dili

### Gizlilik ve veri akışı

İlk kullanım ekranında bilgilendirme metni okunup onaylanmadan kasa kurulumu başlatılamaz. Kasa kayıtları varsayılan olarak cihazda tutulur; ana şifre, kayıtlar veya güvenlik analizi bir uygulama sunucusuna gönderilmez. Bu durum tek başına KVKK veya GDPR uyumluluk sertifikası değildir.

Native platformlarda hassas anahtar değerleri Expo SecureStore ile korunur. Web ortamında aynı uygulama akışı AsyncStorage ve tarayıcı depolaması kullanır; web depolamasını native SecureStore ile aynı güvenlik seviyesinde kabul etmeyin. Panoya kopyalanan hassas değerler 30 saniye sonra temizlenmeye çalışılır; pano geçmişi işletim sisteminin ve diğer uygulamaların kontrolündedir.

Ana şifre salt ile anahtar türetme işleminde kullanılır. Doğrulama değeri ile şifreli kasa blob'u ayrı saklanır. Kasa kilitlendiğinde aktif anahtar ve çözülen kayıtlar bellekten temizlenmeye çalışılır. Biyometrik veri Wysgate tarafından oluşturulmaz veya saklanmaz; işletim sistemi yalnızca doğrulama sonucunu sağlar.

### Yedekleme

Yedek, ana şifreden bağımsız bir yedek şifresiyle şifrelenmiş metin olarak dışa aktarılır. Yedek şifresi cihazda saklanmaz ve her yedek kendi oluşturulduğu şifreyle açılır. Yedek dosyasını ve şifresini aynı yerde tutmayın. Geri yükleme mevcut kayıt listesinin yerine yedekteki kayıtları koyar.

### Dizin yapısı

```text
wysgate/
├── app/
│   ├── _layout.tsx          # Root stack, font ve provider kurulumu
│   ├── index.tsx            # Açılış, gizlilik, kurulum, kilit ve ana sayfa
│   ├── vault.tsx            # Tüm kayıtlar ve favoriler
│   ├── new.tsx              # Kayıt ekleme/düzenleme
│   ├── entry/[id].tsx       # Kayıt ayrıntısı
│   ├── security.tsx         # Güvenlik merkezi
│   ├── generator.tsx        # Parola üretici
│   ├── settings.tsx         # Ayarlar, dil, privacy, yedek ve silme
│   └── +not-found.tsx       # Bilinmeyen route ekranı
├── components/
│   ├── VaultProvider.tsx    # Kasa state'i ve kalıcı depolama
│   ├── ErrorBoundary.tsx    # Kontrollü hata sınırı
│   ├── ErrorFallback.tsx    # Geliştirme hata ayrıntıları
│   ├── KeyboardAwareScrollViewCompat.tsx
│   └── navigation.ts        # Güvenli geri dönüş
├── constants/colors.ts      # Tema token'ları ve paletler
├── hooks/useColors.ts       # Aktif tema token'larına erişim
├── lib/
│   ├── crypto.ts            # Salt, key derivation ve şifreleme
│   ├── security.ts          # Parola analizleri
│   └── i18n.ts              # Türkçe/English metinler ve kategori adları
├── assets/images/           # Wysgate marka görselleri
├── app.json                # Expo, Android, iOS ve web ayarları
├── eas.json                # Native build profilleri
├── pnpm-workspace.yaml     # Workspace ve paket politikası
├── .npmrc                  # Release-age politikasının proje karşılığı
└── LICENSE                 # MIT lisansı
```

### Geliştirme ve doğrulama

Gereksinimler: Node.js 24 veya üzeri, Corepack ve pnpm.

```powershell
corepack enable
corepack pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm start
```

`pnpm run build`, Expo web çıktısını `dist/` klasörüne üretir. `dist/`, `.expo/`, `node_modules/`, npm ile oluşturulmuş `package-lock.json` ve yerel cache dosyaları kaynak dağıtıma dahil edilmez.

### Sahiplik ayrımı ve Android APK oluşturma

Bu projede iki farklı kimlik vardır: EAS/Expo hesabı `wysteria3` hesabıdır ve `app.json` içindeki `owner` alanı bunu gösterir. Uygulamanın proje/Android kimliği ise `wisteriae` markası altında korunur: `com.wisteriae.wysgate`. APK oluştururken `eas login` ile `wysteria3` hesabına giriş yapılmalıdır.

1. ZIP'i açıp proje kök klasöründe terminal açın.
2. Bağımlılıkları kurup kontrolleri çalıştırın:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm run typecheck
```

3. EAS CLI'ı kurun ve Expo hesabınızla giriş yapın:

```powershell
pnpm add --global eas-cli
eas login
eas whoami
```

`eas whoami` çıktısının `wysteria3` olduğunu kontrol edin. İlk kullanımda EAS Android imzalama anahtarını sorarsa yeni bir keystore oluşturmasına izin verin; keystore dosyasını ve parolasını kaynak ZIP'e koymayın.

4. Test amaçlı imzalı APK üretin:

```powershell
eas build --profile preview --platform android
```

`preview` profili `eas.json` içinde APK olarak ayarlanmıştır. Derleme tamamlandığında EAS CLI'ın verdiği bağlantıdan APK'yı indirin ve Android cihazınıza kurun. Mağaza yayını için APK değil, genellikle AAB gerekir; bunun için `production` profili kullanılmalıdır.

5. Gerçek cihazda ana şifre, biyometri, otomatik kilit, yedek dışa/içe aktarma, pano temizleme ve Türkçe/English dil geçişini test edin. Web export testi için `pnpm run build` çalıştırılabilir; web depolaması native SecureStore ile aynı güvenlik seviyesinde değildir.

### Bağımlılık kilidi ve minimum yayın yaşı

Bu proje tek bir `pnpm-lock.yaml` kullanır. Eski `.bad` veya `.backup` lock kopyaları ve ikinci bir package manager lockfile'ı kaynak pakette tutulmaz. `pnpm-workspace.yaml` ve `.npmrc`, bağımlılık kurulumunun yeni yayınları yanlışlıkla reddetmemesi için `minimumReleaseAge=0` politikasını açıkça tanımlar. Lockfile değiştirilirse yalnızca proje kökünden aşağıdaki komutlarla yenilenmelidir:

```powershell
pnpm install --lockfile-only --config.minimum-release-age=0
pnpm install --frozen-lockfile
```

Kurulum hatası lockfile doğrulamasından kaynaklanıyorsa rastgele bir yedek lockfile kopyalamayın; geçerli `package.json` ile lockfile'ı birlikte gözden geçirip tek lockfile'ı yeniden üretin.

### Güvenlik sınırları

Bu proje mutlak güvenlik, hacklenemezlik, sertifika veya hukuki uyumluluk garantisi vermez. Root/jailbreak, zararlı yazılım, kilidi açık cihaz, ekran görüntüsü, işletim sistemi yedekleri, pano geçmişi, paylaşılan yedek dosyası ve ana şifrenin kaybedilmesi uygulamanın tek başına kontrol edemeyeceği risklerdir. Native biyometri, SecureStore, otomatik kilit ve pano davranışı gerçek Android/iOS cihazlarında ayrıca doğrulanmalıdır.

## English

Wysgate is a local-first password manager built with Expo and React Native. The encrypted vault is stored on the user’s device by default. The app does not require a hosted account, does not create a central password database, and keeps the master password out of persistent plain-text storage.

### Features

- Encrypted local vault protected by a master password
- Numbered privacy and security onboarding before setup
- Native biometric unlock on Android and iOS
- Automatic locking after backgrounding
- Strong password generator with clipboard copying
- Local checks for weak, reused, and old passwords
- Search, categories, favorites, and critical-account flags
- Encrypted export and restore with a separate backup password
- Theme, palette, monochrome, contrast, text-size, and touch-target controls
- Turkish and English UI

### Technical model

The master password is combined with a salt for key derivation. A verifier and the encrypted vault blob are stored separately. Native platforms use Expo SecureStore for sensitive key material; the web build uses AsyncStorage and browser storage and should not be treated as equivalent to native SecureStore. Biometric data is never created or stored by Wysgate. The operating system returns only an authentication result.

Exports are encrypted text payloads protected by a separate backup password. Restore replaces the current entry list with the backup contents. Clipboard clearing is attempted after 30 seconds, but clipboard history remains an operating-system security surface.

### Project layout

The actual project layout is the tree shown in the Turkish section. Expo Router screens live under `app/`, persistent vault state lives in `components/VaultProvider.tsx`, cryptographic and security helpers live under `lib/`, and all user-facing language strings are centralized in `lib/i18n.ts`.

### Commands

```powershell
corepack enable
corepack pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm start
```

The web export is written to `dist/`. Do not commit generated `.expo/`, `dist/`, `node_modules/`, npm lockfiles, or local caches. The project uses one authoritative `pnpm-lock.yaml`; release-age behavior is explicitly configured in `pnpm-workspace.yaml` and `.npmrc`.

### License

Wysgate is released under the MIT License. The license is public, permissive, and allows use, modification, redistribution, and private or commercial forks, subject to the notice in `LICENSE`.