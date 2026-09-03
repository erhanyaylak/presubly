# Presubly — Kurulum (Deskly deseni: Clerk + Cloudflare D1)

AI destekli **gönderim öncesi hakem inceleme** platformu. Mimari birebir Deskly ile aynı:
Vite + React 19 + Clerk (auth) + Cloudflare D1 (kredi/kullanım) + Pages Functions (Anthropic proxy).
**Supabase yok.** Anthropic anahtarı tarayıcıya asla ulaşmaz.

> Bu klasör (`presubly-app/`), önceki `presubly-react` (Supabase) ve `presubly-astro` (Supabase)
> denemelerinin yerini alan, Deskly mimarisine göre kurulmuş **aktif** sürümdür.

## Dosya haritası
```
presubly-app/
├── index.html            Vite giriş
├── main.jsx              ClerkProvider + AuthGate + Presubly
├── styles.css            mockup'tan taşınan tüm stil (Source Serif + terracotta/navy)
├── authContext.js        useAuth() — credits/isPro/isAdmin/getToken
├── AuthGate.jsx          SignedOut→Landing, SignedIn→/api/me ile profil yükle
├── Landing.jsx           pazarlama sayfası (Clerk sign-in/up modalları)
├── Presubly.jsx          uygulama kabuğu: Panel + 5 araç + Billing + Ayarlar + Yönetim
├── presubly-config.js    araç kataloğu + sistem promptları + kredi paketleri
├── md.js                 AI çıktısı için mini Markdown→HTML
├── functions/api/
│   ├── _clerk.ts         Clerk JWT doğrulama
│   ├── _db.ts            D1 kredi/kullanım yardımcıları
│   ├── me.ts             POST /api/me — profil + kredi
│   ├── claude.ts         Anthropic proxy — araç başına maliyet (TOOL_COSTS)
│   ├── usage.ts          GET /api/usage — son kullanımlar
│   └── admin/users.ts    admin: kullanıcı listesi + kredi/pro düzenleme
├── d1/schema.sql         profiles + usage_logs
└── wrangler.toml         D1 binding (database_id doldur)
```

## Araçlar ve maliyetleri (sunucu-otoriter, `functions/api/claude.ts`)
| Araç | action | Kredi | Kademe |
|---|---|---|---|
| Uyumluluk Taraması (Readiness) | `readiness` | 3 | Ücretsiz |
| Bilimsel Hakem İncelemesi | `peer_review` | 3 | Ücretsiz |
| Editöryal Değerlendirme | `editorial` | 2 | Ücretsiz |
| Yanıt Asistanı | `response` | 2 | Ücretsiz |
| İstatistik Denetleyici | `stats` | 2 | Ücretsiz |
| Submission Checklist | `checklist` | 1 | Ücretsiz |
| Atıf–Kaynakça Denetimi | `citecheck` | 2 | **Pro** |
| Kapak Mektubu | `coverletter` | 2 | **Pro** |

Yeni üye 6 kredi ile başlar. Admin = sınırsız + otomatik Kurumsal.

## Paket kademeleri ve özellik kapıları (`plans.js` ↔ `functions/api/_db.ts`)
Gating hem istemci (`can(plan,isAdmin,feature)`) hem sunucu (`canUse`, 402 `UPGRADE`) tarafında. Kümülatif — üst paket alttakileri kapsar.

| Kademe | Fiyat | Açılan özellikler (feature key) |
|---|---|---|
| **Ücretsiz** | $0 | 6 araç (temel), metin yapıştır, .md indir |
| **Akademik** | $15/ay | Dergi profili kütüphanesi (`journals`) · .docx yükleme (`docx`) · Rapor arşivi (`history`) |
| **Pro** | $35/ay | Yeniden tarama & karşılaştırma (`diff`) · Atıf–kaynakça (`citecheck`) · Kapak mektubu (`coverletter`) |
| **Kurumsal** | Teklif | Paylaşılabilir link (`share`) · PDF çıktı (`pdf`) · API + OJS/DergiPark (`api`) |

Kademe `profiles.plan` kolonunda (`free|academic|pro|enterprise`). Admin her zaman `enterprise`.
**Yeni tablolar:** `journals` (seed'li kütüphane + kullanıcı özel profilleri), `saved_reports` (arşiv/diff), `shared_reports` (public link, 7g TTL), `api_keys` (SHA-256 hash saklanır).

### Kurumsal API — POST `/api/v1/scan`
`x-api-key: psb_live_...` başlığıyla programatik readiness taraması (OJS/DergiPark entegrasyonu). Gövde `{text, journalRules?}`, yanıt readiness report JSON. Anahtar sahibinden 3 kredi düşer. Anahtarlar app içinde **API Erişimi** sekmesinden üretilir (tam anahtar yalnızca bir kez gösterilir).

## Adım adım kurulum

### 0. Bağımlılıklar
```bash
cd "TENOPARK ŞİRKET/PRESUBLY/presubly-app"
npm install
```

### 1. Clerk
1. https://dashboard.clerk.com → yeni uygulama (veya mevcut Presubly instance).
2. **API Keys**'ten `pk_test_...` (publishable) ve `sk_test_...` (secret) al.
3. `.env` oluştur:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   ```
   (`.env.example`'ı kopyala.)

### 2. Anthropic + yerel secret'lar
`.dev.vars` oluştur (`.dev.vars.example`'ı kopyala):
```
CLERK_SECRET_KEY=sk_test_xxx
ANTHROPIC_API_KEY=sk-ant-xxx
AI_MODEL=claude-sonnet-5
```

### 3. D1 veritabanı
```bash
npx wrangler d1 create presubly-db
# çıktıdaki database_id'yi wrangler.toml içine yapıştır (REPLACE_WITH_D1_DATABASE_ID)
npm run db:init            # yerel şema (tüm tablolar + dergi seed)
npm run db:init:remote     # production şema
```
> **Mevcut bir DB'yi güncelliyorsan** (sıfırdan değil), tam şema yerine additive migration'ı çalıştır:
> `npx wrangler d1 execute presubly-db --remote --file=./d1/002_plans_and_features.sql`
> (plan kolonu + journals/saved_reports/shared_reports/api_keys tabloları + dergi seed).
> `plan` kolonu zaten varsa ALTER satırı hata verir — o satırı atlayıp gerisini çalıştır.

### 4. Yerel geliştirme
- Sadece arayüz (Functions olmadan, AI çağrıları çalışmaz):
  ```bash
  npm run dev            # http://localhost:3200
  ```
- Functions dahil tam yerel (AI + D1 çalışır):
  ```bash
  npm run dev:full       # wrangler pages dev dist
  ```

### 5. Deploy (Cloudflare Pages)
```bash
npm run deploy           # build + wrangler pages deploy dist --project-name=presubly
```
Production secret'ları Pages panelinden veya:
```bash
npx wrangler pages secret put CLERK_SECRET_KEY --project-name=presubly
npx wrangler pages secret put ANTHROPIC_API_KEY --project-name=presubly
```
> **Secret gotcha (Scitera'dan):** PowerShell `|` ile secret verme (\r\n ekler). Bash kullan:
> `printf '%s' 'DEGER' | npx wrangler pages secret put NAME --project-name=presubly`
> Secret değişince **yeniden deploy** gerekir.

### 6. Kendini admin yap
Clerk'e giriş yaptıktan sonra Clerk user id'ni al (Clerk dashboard → Users) ve:
```bash
npx wrangler d1 execute presubly-db --remote \
  --command "UPDATE profiles SET is_admin=1, is_pro=1 WHERE id='user_XXX'"
```
Artık sidebar'da **Yönetim** sekmesi ve sınırsız kredi (∞) görürsün.

## Notlar
- Makale metni sunucuda saklanmaz; yalnızca tarama anında Anthropic'e iletilir. `usage_logs` sadece araç adı + tarih + maliyet tutar. `saved_reports`/`shared_reports` yalnızca kullanıcı "Kaydet"/"Paylaş" derse rapor JSON'unu tutar.
- **Plan atama:** self-servis ödeme **Phase 2** (butonlar bilgi toast'u gösterir). Şimdilik plan admin panelinden (Yönetim → kullanıcı satırında plan seçici) veya D1'den atanır: `UPDATE profiles SET plan='pro' WHERE id='user_...'`. Kredi yükleme: admin `+20 ⚡` veya `UPDATE profiles SET credits=...`.
- `.docx` yükleme **mammoth** ile (Akademik+); tarayıcıda metne çevrilir, dinamik import (yalnız gerektiğinde yüklenir). `.pdf` henüz yok (pdfjs eklenebilir).
- PDF çıktı = tarayıcı yazdır (`window.print`, print CSS ile sade rapor). Gerçek PDF motoru (jsPDF) sonraki adımda eklenebilir.
- OJS/DergiPark: `/api/v1/scan` uç noktası + API anahtarı altyapısı hazır. Gerçek OJS eklentisi (plugin) ayrı bir iş — bu API onun temeli.
- EN dili hâlâ placeholder (yalnız TR aktif).
