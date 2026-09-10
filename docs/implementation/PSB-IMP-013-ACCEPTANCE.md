# PSB-IMP-013 — Kabul ve Doğrulama Kaydı

## Sonuç

**Koşullu kabul — kaynak doğrulaması geçti, ortam doğrulaması bekliyor.**

Gönderim Operasyon Merkezi'nin kullanıcı arayüzü, Pages Function uç noktası ve
veritabanı göçü kaynak düzeyinde doğrulandı. Üretim Supabase projesinde
`public.manuscript_operations` tablosu henüz bulunmadığı için özellik canlıya
alınmaya hazır kabul edilmemiştir.

Bu doğrulama sırasında canlı Sites dağıtımı yapılmamış ve üretim veritabanında
DDL değişikliği uygulanmamıştır.

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
| Üretim tablosu | **Kaldı** | Supabase `public` tablo envanterinde `manuscript_operations` yok |
| Kimliği doğrulanmış uçtan uca veri akışı | Bekliyor | Tablo uygulanmadan GET/PUT ve iki kullanıcılı izolasyon testi yapılamaz |

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
(`ufdtfspvlapazaszbgpr`) salt okunur olarak denetlendi:

- Proje durumu: `ACTIVE_HEALTHY`.
- `public.manuscript_operations`: bulunamadı.
- Dolayısıyla göçün üretim ortamına uygulanmış olduğuna dair kanıt yok.
- Proje genelindeki danışman taramasında PSB-IMP-013 dışındaki mevcut tablolar ve
  `SECURITY DEFINER` işlevler için önceden var olan güvenlik uyarıları görüldü.
  Bunlar bu fazın kaynak kabulünü değiştirmez; ancak canlıya alma öncesinde ayrı
  bir güvenlik iyileştirme çalışması olarak ele alınmalıdır.

## Bilinen sınırlamalar

- Yerel Pages sunucusu çalışma ortamındaki ağ arabirimi hatası nedeniyle
  başlatılamadı (`uv_interface_addresses`). İstemci ve Worker derlemeleri bu
  ortam hatasından bağımsız olarak geçti.
- Gerçek kullanıcı oturumuyla tarayıcı testi yapılmadı.
- Üretim veritabanına yazma veya şema değişikliği yapılmadı.
- Canlı dağıtım yapılmadı.

## Tam kabul ve yayın kapıları

PSB-IMP-013'ün **tam kabul** durumuna geçmesi için:

1. Güncel tekil göç, yetkili onayından sonra Supabase projesine uygulanmalı.
2. Tablo sütunları, benzersiz kısıt, indeks, RLS ve rol yetkileri SQL ile yeniden
   doğrulanmalı.
3. İki ayrı test kullanıcısıyla veri izolasyonu doğrulanmalı: A kullanıcısının
   kaydı B kullanıcısının GET sonucunda görünmemeli ve B tarafından
   güncellenememeli.
4. Yetkili kullanıcı için GET, ilk PUT (`201`) ve sonraki PUT (`200`) akışları;
   geçersiz durum/tarih ve plan kapısı sınanmalı.
5. Supabase güvenlik ve performans danışmanları yeniden çalıştırılmalı.
6. Canlı Sites dağıtımı yalnızca açık yayın onayından sonra yapılmalı.

Bu kapılar tamamlanana kadar durum: **canlıya hazır değil**.
