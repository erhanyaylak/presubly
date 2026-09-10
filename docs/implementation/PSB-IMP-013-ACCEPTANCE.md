# PSB-IMP-013 — Kabul ve Doğrulama Kaydı

## Sonuç

**Kaynak ve veritabanı kabulü geçti — kimliği doğrulanmış uçtan uca test ve yayın bekliyor.**

Gönderim Operasyon Merkezi'nin kullanıcı arayüzü, Pages Function uç noktası ve
veritabanı göçü kaynak düzeyinde doğrulandı. Göç üretim Supabase projesine
uygulandı; tablo yapısı, kısıtlar, indeks, RLS ve en az yetkili rol erişimleri
doğrudan veritabanından doğrulandı.

Bu doğrulama sırasında canlı Sites dağıtımı yapılmamıştır.

## Kapsam

| Bileşen | Kaynak |
|---|---|
| Çalışma alanı | `presubly-app/Presubly.jsx` |
| Duyarlı görünüm | `presubly-app/styles.css` |
| API | `presubly-app/functions/api/operations.ts` |
| Tekil göç | `presubly-app/supabase/psb-imp-013-submission-operations.sql` |
| Kanonik şema | `presubly-app/supabase/schema.sql` |
| Tekrarlanabilir kontrol | `presubly-app/scripts/check-psb-imp-013.mjs` |

## Otomatik doğrulama

| Kontrol | Sonuç | Kanıt |
|---|---|---|
| PSB-IMP-013 kaynak sözleşmesi | Geçti | `node scripts/check-psb-imp-013.mjs` → **17/17** |
| İstemci üretim derlemesi | Geçti | Vite 6.4.3, 2056 modül, başarılı üretim çıktısı |
| Pages Functions derlemesi | Geçti | Wrangler, `functions/` → Worker başarıyla derlendi |
| Durum ve tarih doğrulaması | Geçti | Sabit durum listesi; geçersiz durum/tarih için `400` |
| Kimlik doğrulama kapısı | Geçti | Bearer oturumu yoksa `401` |
| Plan yetkisi | Geçti | `history` yetkisi yoksa `402 / UPGRADE` |
| Kullanıcı izolasyonu — kaynak | Geçti | GET, upsert araması ve UPDATE sorgularının tamamı `user_id` ile sınırlandırılmış |
| Mobil/boş/yükleniyor/filtre/düzenleme durumları | Geçti | İlgili görünüm ve duyarlı CSS kuralları mevcut |
| Üretim tablosu | Geçti | `public.manuscript_operations` oluşturuldu; 10 sütun, PK, kullanıcı FK'sı, durum kontrolü ve kullanıcı+başlık benzersizliği doğrulandı |
| RLS ve rol yetkileri | Geçti | RLS açık; `anon`/`authenticated` yetkisi yok; `service_role` yalnızca `SELECT`, `INSERT`, `UPDATE` |
| İndeks | Geçti | `manuscript_operations_user_updated_idx` mevcut |
| Kimliği doğrulanmış uçtan uca veri akışı | Bekliyor | Gerçek kullanıcı oturumu olmadan GET/PUT ve iki kullanıcılı izolasyon testi yapılmadı |

## Güvenlik doğrulaması

PSB-IMP-013 göçü aşağıdaki erişim modelini açıkça uygular:

- `user_id`, `auth.users(id)` alanına bağlıdır.
- `(user_id, manuscript_title)` benzersizdir.
- RLS etkindir ve tarayıcı rollerine doğrudan politika verilmez.
- `anon` ve `authenticated` rollerinin tablo yetkileri açıkça kaldırılır.
- Yalnızca sunucu tarafındaki `service_role` için gereken `SELECT`, `INSERT` ve
  `UPDATE` yetkileri verilir.
- API, kullanıcı kimliğini erişim belirtecinden çözer ve tüm okumaları/yazmaları
  bu kullanıcı kimliğiyle sınırlar.

Bu açık yetki tanımı, Supabase'in yeni tabloların Data API'ye otomatik açılmasına
ilişkin güncel davranış değişikliğine karşı göçü belirgin ve tekrarlanabilir kılar:

- <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>
- <https://supabase.com/docs/guides/api/securing-your-api>

## Ortam gözlemi

10 Eylül 2026 tarihinde Supabase projesi `presubly.com`
(`ufdtfspvlapazaszbgpr`) üzerinde göç uygulanıp doğrulandı:

- Proje durumu: `ACTIVE_HEALTHY`.
- `20260910201513_psb_imp_013_submission_operations`: uygulandı.
- `20260910201608_psb_imp_013_least_privilege`: uygulandı.
- `public.manuscript_operations`: mevcut, RLS etkin ve boş (`0` satır).
- `anon` ve `authenticated`: tablo yetkisi yok.
- `service_role`: yalnızca `INSERT`, `SELECT`, `UPDATE`.
- PSB-IMP-013 için danışman sonuçları yalnızca beklenen bilgi düzeyindeki
  `RLS açık, politika yok` ve yeni indeks henüz kullanılmadı bildirimleridir.
- Proje genelindeki danışman taramasında PSB-IMP-013 dışındaki mevcut tablolar ve
  `SECURITY DEFINER` işlevler için önceden var olan güvenlik uyarıları görüldü.
  Bunlar bu fazın kaynak kabulünü değiştirmez; ancak canlıya alma öncesinde ayrı
  bir güvenlik iyileştirme çalışması olarak ele alınmalıdır.

## Bilinen sınırlamalar

- Yerel Pages sunucusu çalışma ortamındaki ağ arabirimi hatası nedeniyle
  başlatılamadı (`uv_interface_addresses`). İstemci ve Worker derlemeleri bu
  ortam hatasından bağımsız olarak geçti.
- Gerçek kullanıcı oturumuyla tarayıcı testi yapılmadı.
- Canlı dağıtım yapılmadı.

## Tam kabul ve yayın kapıları

PSB-IMP-013'ün kalan **uçtan uca kabul ve yayın** kapıları:

1. İki ayrı test kullanıcısıyla veri izolasyonu doğrulanmalı: A kullanıcısının
   kaydı B kullanıcısının GET sonucunda görünmemeli ve B tarafından
   güncellenememeli.
2. Yetkili kullanıcı için GET, ilk PUT (`201`) ve sonraki PUT (`200`) akışları;
   geçersiz durum/tarih ve plan kapısı sınanmalı.
3. Proje genelinde önceden var olan Supabase güvenlik uyarıları ayrı bir
   iyileştirme çalışmasında ele alınmalı.
4. Canlı Sites dağıtımı yalnızca açık yayın onayından sonra yapılmalı.

Mevcut durum: **veritabanı hazır; canlı yayın yapılmadı**.
