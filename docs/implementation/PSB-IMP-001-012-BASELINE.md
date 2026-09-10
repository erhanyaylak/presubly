# PSB-IMP-001–012 — Konsolide Başlangıç Kaydı

## Belgenin amacı

Bu belge, Presubly'nin GitHub'a ilk kez toplu olarak aktarılan işlevlerini
`PSB-IMP-001`–`PSB-IMP-012` fazları altında geriye dönük olarak sınıflandırır.
Amaç, sonraki geliştirmeler için denetlenebilir bir başlangıç çizgisi oluşturmaktır.

> **Tarihsel kayıt uyarısı:** Aşağıdaki fazlar bağımsız tarihsel commit'ler değildir.
> Kaynak kod GitHub'a `cc91671` (`Initial commit: Presubly`) ile tek seferde
> aktarılmıştır. Bu nedenle faz numaraları mevcut kodun sorumluluk alanlarını
> gösterir; özgün geliştirme sırasını veya tamamlanma tarihini kanıtlamaz.

## Kaynak ve durum

| Alan | Değer |
|---|---|
| Depo | `erhanyaylak/presubly` |
| Kaynak dal | `main` |
| Konsolide kaynak commit'i | `cc91671` |
| Kayıt yöntemi | Mevcut kaynak koddan geriye dönük işlev eşleştirmesi |
| Durum terimi | `Konsolide başlangıç` — ilk commit'te mevcut, ayrı faz commit'i yok |
| Sonraki numaralı geliştirme | `PSB-IMP-013 — Gönderim Operasyon Merkezi` |

## Faz envanteri

| Faz | Kapsam | Somut çıktı | Başlıca kanıt dosyaları | Durum |
|---|---|---|---|---|
| `PSB-IMP-001` | Ürün kabuğu ve iki dilli deneyim | React/Vite uygulama girişi, TR/EN dil sağlayıcısı, ana çalışma alanı ve tanıtım sayfaları | `presubly-app/main.jsx`, `presubly-app/Landing.jsx`, `presubly-app/Presubly.jsx`, `presubly-app/lang.jsx` | Konsolide başlangıç |
| `PSB-IMP-002` | Kimlik doğrulama ve kullanıcı profili | Supabase oturumu, kayıt/giriş ekranı, profil oluşturma ve korumalı uygulama geçidi | `presubly-app/Auth.jsx`, `presubly-app/AuthGate.jsx`, `presubly-app/authContext.js`, `presubly-app/supabaseClient.js`, `presubly-app/functions/api/me.ts` | Konsolide başlangıç |
| `PSB-IMP-003` | Makale alma ve giriş doğrulama | Metin girişi, PDF/DOCX içeriği çıkarma, boyut/biçim kontrolleri ve doğrulama yardımcıları | `presubly-app/fileText.js`, `presubly-app/validate.js`, `presubly-app/Presubly.jsx` | Konsolide başlangıç |
| `PSB-IMP-004` | Güvenli AI yürütme ve kredi altyapısı | Sunucu tarafı AI geçidi, araç maliyetleri, plan kapıları, atomik kredi düşümü ve kullanım günlüğü | `presubly-app/functions/api/claude.ts`, `presubly-app/functions/api/_db.ts`, `presubly-app/functions/api/usage.ts`, `presubly-app/plans.js` | Konsolide başlangıç |
| `PSB-IMP-005` | Hakem simülasyonu ve gönderime hazırlık | Sekiz boyutlu hakem simülasyonu, kritik kapılar ve puanlı uyumluluk taraması | `presubly-app/presubly-config.js`, `presubly-app/simEngine.js`, `presubly-app/SimReport.jsx`, `presubly-app/Report.jsx` | Konsolide başlangıç |
| `PSB-IMP-006` | Bilimsel ve editöryal değerlendirme | Bilimsel hakem raporu, editör kararı, kapsam ve etik değerlendirmesi | `presubly-app/presubly-config.js`, `presubly-app/EditorialReport.jsx`, `presubly-app/Report.jsx` | Konsolide başlangıç |
| `PSB-IMP-007` | Uzman denetim araçları | İstatistik denetimi, gönderim kontrol listesi ve atıf–kaynakça eşleştirmesi | `presubly-app/presubly-config.js`, `presubly-app/Presubly.jsx` | Konsolide başlangıç |
| `PSB-IMP-008` | Revizyon ve yazar yanıtı | Point-by-point yanıt üretimi, önceki bulgulara karşı revizyon doğrulaması | `presubly-app/ResponseReport.jsx`, `presubly-app/presubly-config.js`, `presubly-app/Presubly.jsx` | Konsolide başlangıç |
| `PSB-IMP-009` | Kapak mektubu ve dergi profilleri | Kapak mektubu üretimi, kayıtlı dergi profili ve dergi uyumu girdileri | `presubly-app/CoverLetterReport.jsx`, `presubly-app/functions/api/journals.ts`, `presubly-app/presubly-config.js` | Konsolide başlangıç |
| `PSB-IMP-010` | Rapor arşivi, sürümleme ve dışa aktarma | Makale bazlı rapor geçmişi, sürüm karşılaştırması, yorumlu nüsha, Word/PDF dışa aktarma | `presubly-app/functions/api/reports.ts`, `presubly-app/exports.js`, `presubly-app/Comments.jsx`, `presubly-app/Presubly.jsx` | Konsolide başlangıç |
| `PSB-IMP-011` | Paylaşım ve ekip işbirliği | Paylaşılabilir rapor bağlantıları, ekip üyeliği ve rapor yorumları | `presubly-app/functions/api/share.ts`, `presubly-app/SharedView.jsx`, `presubly-app/functions/api/team.ts`, `presubly-app/functions/api/comments.ts` | Konsolide başlangıç |
| `PSB-IMP-012` | Kurumsal API ve yönetim | API anahtarı yönetimi, tarama uç noktası, plan/kredi yönetimi ve yönetici görünümü | `presubly-app/functions/api/apikeys.ts`, `presubly-app/functions/api/v1/scan.ts`, `presubly-app/functions/api/admin/users.ts`, `presubly-app/Presubly.jsx` | Konsolide başlangıç |

## Veri modeli karşılıkları

| Tablo / işlev | İlgili fazlar | Amaç |
|---|---|---|
| `profiles`, `handle_new_user` | `PSB-IMP-002`, `PSB-IMP-004` | Kullanıcı, plan, kredi ve yönetici durumu |
| `usage_logs`, `deduct_credits`, `add_credits` | `PSB-IMP-004` | Sunucu-otoriter kullanım ve kredi kaydı |
| `journals` | `PSB-IMP-009` | Yerleşik ve kullanıcıya özel dergi profilleri |
| `saved_reports` | `PSB-IMP-010` | Değerlendirme anlık görüntüleri ve sürüm geçmişi |
| `shared_reports`, `bump_share_views` | `PSB-IMP-011` | Paylaşılan raporlar ve görüntülenme sayacı |
| `api_keys` | `PSB-IMP-012` | Kurumsal API kimlik bilgileri |

Kanonik şema: `presubly-app/supabase/schema.sql`.

## Doğrulama ölçütü

Bir fazın bu başlangıç kaydında yer alması için aşağıdaki koşullardan en az biri
aranmıştır:

1. Kullanıcı arayüzünde erişilebilir bir işlevinin bulunması.
2. İşlevi gerçekleştiren bir sunucu uç noktası veya veri modeli bulunması.
3. Araç kataloğunda açık bir eylem, çıktı şeması ya da plan yetkisi tanımlanması.

Bu inceleme, işlevlerin kaynakta bulunduğunu doğrular; canlı ortam yapılandırmasını,
harici servis anahtarlarını, Supabase göçlerinin uygulanmış olmasını veya uçtan uca
üretim davranışını tek başına doğrulamaz.

## Bundan sonraki kayıt standardı

`PSB-IMP-013` ve sonraki her geliştirme için:

1. Faz kodu kaynakta ve ilgili dokümanda açıkça yazılır.
2. Değişiklik ayrı, anlamlı bir commit ile `main` dalına kaydedilir.
3. Veri modeli değişikliği varsa bağımsız ve tekrarlanabilir bir SQL göçü eklenir.
4. Doğrulama sonucu commit veya faz dokümanında belirtilir.
5. Yayınlama, kaynak kaydından ayrı bir işlem olarak yürütülür.

## İzlenebilirlik notu

Bu belge, `PSB-IMP-001`–`PSB-IMP-012` için başlangıç envanteridir. Yeni kanıt
bulunursa kapsam satırları güncellenebilir; ancak geçmişe dönük ayrı commit'ler varmış
gibi tarih veya commit üretilmemelidir.
