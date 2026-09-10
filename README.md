# Presubly

AI destekli **gönderim öncesi (pre-submission) hakem inceleme** platformu.
Akademik makaleleri dergiye göndermeden önce tarar: uyumluluk, hakem incelemesi,
editöryal değerlendirme, istatistik denetimi, atıf–kaynakça kontrolü ve kapak mektubu.

## Depo yapısı

| Klasör | Durum | Stack |
|---|---|---|
| **`presubly-app/`** | ✅ **AKTİF SÜRÜM** | React 19 + Vite 6 + Supabase + Cloudflare Pages Functions |
| `presubly-react/` | ⚠️ Terk edildi | React 19 + Vite 8 + Tailwind 4 + react-router |
| `presubly-astro/` | ⚠️ Terk edildi | Astro 6 + Preact + Cloudflare |
| `google ai studio/` | Deneme | Vite + TS prototipi |
| `BRAND KİT/`, `*.html` | Marka varlıkları | Brand kit, marka hikâyesi (TR/EN), v2 mockup, fiyat sayfası |
| `ÖRNEK ÇIKTILAR/` | Referans | Araçların örnek çıktıları |
| `*.sql` | Veritabanı | Supabase şema + RLS düzeltmeleri |

Yeni geliştirme **yalnızca `presubly-app/`** içinde yapılır.

## Uygulama modülleri

- Analiz araçları: hakem simülasyonu, uyumluluk, editöryal değerlendirme, istatistik, kontrol listesi ve revizyon doğrulama.
- Rapor arşivi: makale bazlı sürümleme, karşılaştırma, dışa aktarma ve ekip yorumları.
- **Gönderim Operasyon Merkezi (PSB-IMP-013):** kayıtlı analizlerden otomatik makale hattı; hedef dergi, durum, son tarih, kritik engel ve sıradaki eylem yönetimi.

PSB-IMP-013 veritabanı değişikliği için `presubly-app/supabase/psb-imp-013-submission-operations.sql`
dosyasını Supabase SQL Editor'da bir kez çalıştırın. Bu işlem canlı dağıtımdan bağımsızdır.

PSB-IMP-001–012'nin geriye dönük işlev eşleştirmesi için
[`docs/implementation/PSB-IMP-001-012-BASELINE.md`](docs/implementation/PSB-IMP-001-012-BASELINE.md)
belgesine bakın. Bu fazlar ayrı tarihsel commit'ler değil, ilk kaynak aktarımının
konsolide başlangıç kaydıdır.

## Çalıştırma (presubly-app)

```bash
cd presubly-app
npm install
cp .env.example .env          # Supabase + Turnstile public degerleri
cp .dev.vars.example .dev.vars # sunucu tarafi sirlar (Anthropic anahtari vb.)
npm run dev
```

Dağıtım: `npm run deploy` → Cloudflare Pages (`--project-name=presubly`).

## Araçlar ve kredi maliyetleri

Sunucu-otoriter, `presubly-app/functions/api/claude.ts` içinde tanımlı.

| Araç | action | Kredi | Kademe |
|---|---|---|---|
| Uyumluluk Taraması | `readiness` | 3 | Ücretsiz |
| Bilimsel Hakem İncelemesi | `peer_review` | 3 | Ücretsiz |
| Editöryal Değerlendirme | `editorial` | 2 | Ücretsiz |
| Yanıt Asistanı | `response` | 2 | Ücretsiz |
| İstatistik Denetleyici | `stats` | 2 | Ücretsiz |
| Submission Checklist | `checklist` | 1 | Ücretsiz |
| Atıf–Kaynakça Denetimi | `citecheck` | 2 | Pro |
| Kapak Mektubu | `coverletter` | 2 | Pro |

Paketler: Ücretsiz $0 · Akademik $15/ay · Pro $35/ay · Kurumsal (teklif).

## ⚠️ Notlar

- `presubly-app/SETUP.md` **güncel değil**: Clerk + Cloudflare D1 anlatıyor, ancak proje
  Supabase'e geçti (`functions/api/_supabase.ts`, `@supabase/supabase-js`). Auth/DB
  konusunda dokümana değil koda güvenin.
- Sırlar (`.env`, `.env.local`, `.dev.vars`) depoya dahil **değildir**; yalnızca
  `.example` şablonları bulunur.
