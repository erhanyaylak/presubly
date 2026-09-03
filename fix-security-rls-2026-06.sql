-- ═══════════════════════════════════════════════════════════════
-- PRESUBLY — GUVENLIK SERTLESTIRME (RLS + kolon koruma)
-- Tarih: 2026-06-14
-- Supabase Dashboard > SQL Editor > New Query > Yapistir > Run
--
-- KAPATILAN ACIKLAR:
--   #3  Kullanici kendi is_admin alanini TRUE yapip yetki yukseltebiliyordu.
--   #3b Kullanici kendi credits alanini dogrudan PATCH ile sisirebiliyordu.
--   #4  profiles / presubly_usage / presubly_feedback SELECT herkese acikti
--       (USING(true)) — baska kullanicilarin metadata/kredi/feedback bilgisi
--       sizdiriliyordu.
--
-- BONUS: admin'in baska kullanicinin kredisini duzenlemesi (Admin.saveCredits)
--        eski RLS altinda calismiyordu; bu migration ile dogru calisir hale gelir.
--
-- Idempotent: tekrar tekrar calistirilabilir.
-- ═══════════════════════════════════════════════════════════════


-- ┌─────────────────────────────────────────────────────┐
-- │  0. ADMIN KONTROL YARDIMCISI (recursion'suz)        │
-- └─────────────────────────────────────────────────────┘
-- SECURITY DEFINER oldugu icin icteki SELECT, RLS'i bypass eder →
-- profiles politikalari icinde cagrildiginda sonsuz dongu olusmaz.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ┌─────────────────────────────────────────────────────┐
-- │  1. PROFILES — KOLON KORUMA TRIGGER                 │
-- └─────────────────────────────────────────────────────┘
-- Son kullanici (authenticated/anon rolu) dogrudan UPDATE yaparken
-- credits ve is_admin DEGISTIRILEMEZ — eski degerlerine geri sabitlenir.
-- Admin'ler ve SECURITY DEFINER fonksiyonlar (psb_deduct_credits vb.,
-- tablo sahibi rolu ile calisir) bu kisittan etkilenmez.

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
    NEW.credits  := OLD.credits;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trg_protect_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();


-- ┌─────────────────────────────────────────────────────┐
-- │  2. PROFILES — RLS POLITIKALARI                     │
-- └─────────────────────────────────────────────────────┘

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;

-- SELECT: sadece kendi satirin + admin (eskiden USING(true) idi)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- UPDATE: kendi satirin VEYA admin isen her satir
-- (kolon korumasi trigger'da; admin krediyi degistirebilir)
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- INSERT: sadece kendi id'in
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ┌─────────────────────────────────────────────────────┐
-- │  3. PRESUBLY_USAGE — SELECT KISITLA                 │
-- └─────────────────────────────────────────────────────┘
-- Uygulama bu tabloyu yalnizca psb_user_stats / admin_get_stats RPC
-- (SECURITY DEFINER) uzerinden okur; dogrudan SELECT yapilmiyor.

DROP POLICY IF EXISTS "psb_usage_select" ON public.presubly_usage;
DROP POLICY IF EXISTS "psb_usage_insert" ON public.presubly_usage;

CREATE POLICY "psb_usage_select" ON public.presubly_usage
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "psb_usage_insert" ON public.presubly_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ┌─────────────────────────────────────────────────────┐
-- │  4. PRESUBLY_FEEDBACK — SELECT KISITLA              │
-- └─────────────────────────────────────────────────────┘
-- Uygulama feedback'i admin_get_stats RPC ile okur; dogrudan SELECT yok.

DROP POLICY IF EXISTS "psb_feedback_select" ON public.presubly_feedback;
DROP POLICY IF EXISTS "psb_feedback_insert" ON public.presubly_feedback;

CREATE POLICY "psb_feedback_select" ON public.presubly_feedback
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "psb_feedback_insert" ON public.presubly_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- DOGRULAMA (opsiyonel — calistirip kontrol edebilirsin):
--
--   -- normal kullanici olarak kendi kredini sismeye calis (ETKISIZ olmali):
--   UPDATE public.profiles SET credits = 9999 WHERE id = auth.uid();
--   SELECT credits FROM public.profiles WHERE id = auth.uid();  -- degismedi
--
--   -- baska kullanicinin profilini okumaya calis (BOS donmeli):
--   SELECT * FROM public.profiles WHERE id <> auth.uid();
-- ═══════════════════════════════════════════════════════════════
