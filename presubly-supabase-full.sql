-- ═══════════════════════════════════════════════════════════════
-- PRESUBLY — SUPABASE FULL SETUP
-- Supabase Dashboard > SQL Editor > New Query > Yapistir > Run
-- ═══════════════════════════════════════════════════════════════


-- ┌─────────────────────────────────────────────────────┐
-- │  1. PROFILES TABLOSU                                │
-- └─────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT DEFAULT '',
  credits    INTEGER DEFAULT 3,
  is_admin   BOOLEAN DEFAULT FALSE,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- metadata kolonu yoksa ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admin kontrol yardimcisi (recursion'suz — SECURITY DEFINER RLS bypass eder)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Kolon koruma: son kullanici kendi credits/is_admin alanini DEGISTIREMEZ.
-- Admin'ler ve SECURITY DEFINER fonksiyonlar (tablo sahibi rolu) etkilenmez.
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

-- Eski politikalari temizle
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;

-- Yeni temiz politikalar (kendi satirin + admin; kolon korumasi trigger'da)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ┌─────────────────────────────────────────────────────┐
-- │  2. YENI KULLANICI TRIGGER                          │
-- └─────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, credits, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    3,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ┌─────────────────────────────────────────────────────┐
-- │  3. PRESUBLY KULLANIM TABLOSU                       │
-- └─────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.presubly_usage (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool         TEXT NOT NULL,
  credits_used INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.presubly_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own usage" ON public.presubly_usage;
DROP POLICY IF EXISTS "Users insert own usage" ON public.presubly_usage;
DROP POLICY IF EXISTS "Admins read all usage" ON public.presubly_usage;
DROP POLICY IF EXISTS "psb_usage_select" ON public.presubly_usage;
DROP POLICY IF EXISTS "psb_usage_insert" ON public.presubly_usage;

CREATE POLICY "psb_usage_select" ON public.presubly_usage
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "psb_usage_insert" ON public.presubly_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ┌─────────────────────────────────────────────────────┐
-- │  4. PRESUBLY GERI BILDIRIM TABLOSU                  │
-- └─────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.presubly_feedback (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool       TEXT NOT NULL,
  rating     INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.presubly_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own feedback" ON public.presubly_feedback;
DROP POLICY IF EXISTS "Admins read all feedback" ON public.presubly_feedback;
DROP POLICY IF EXISTS "psb_feedback_select" ON public.presubly_feedback;
DROP POLICY IF EXISTS "psb_feedback_insert" ON public.presubly_feedback;

CREATE POLICY "psb_feedback_select" ON public.presubly_feedback
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "psb_feedback_insert" ON public.presubly_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ┌─────────────────────────────────────────────────────┐
-- │  5. KREDI DUSME FONKSIYONU                          │
-- └─────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.psb_deduct_credits(
  p_user_id UUID,
  p_amount  INTEGER,
  p_tool    TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Yetersiz kredi';
  END IF;

  INSERT INTO public.presubly_usage (user_id, tool, credits_used)
  VALUES (p_user_id, p_tool, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ┌─────────────────────────────────────────────────────┐
-- │  6. KREDI IADE FONKSIYONU                           │
-- └─────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.psb_refund_credits(
  p_user_id UUID,
  p_amount  INTEGER,
  p_tool    TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id;

  INSERT INTO public.presubly_usage (user_id, tool, credits_used)
  VALUES (p_user_id, p_tool, -p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ┌─────────────────────────────────────────────────────┐
-- │  7. ADMIN: KULLANICI LISTESI                        │
-- └─────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  id         UUID,
  email      TEXT,
  full_name  TEXT,
  credits    INTEGER,
  is_admin   BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Yetkisiz erisim';
  END IF;

  RETURN QUERY
  SELECT p.id, u.email::TEXT, p.full_name, p.credits, p.is_admin, p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ┌─────────────────────────────────────────────────────┐
-- │  8. ADMIN: KULLANICI SIL                            │
-- └─────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Yetkisiz erisim';
  END IF;

  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ┌─────────────────────────────────────────────────────┐
-- │  9. ADMIN: PLATFORM ISTATISTIKLERI                  │
-- └─────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Yetkisiz erisim';
  END IF;

  SELECT json_build_object(
    'total_users',    (SELECT COUNT(*) FROM public.profiles),
    'total_usage',    (SELECT COUNT(*) FROM public.presubly_usage),
    'total_feedback', (SELECT COUNT(*) FROM public.presubly_feedback),
    'avg_rating',     (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.presubly_feedback),

    'usage_by_tool', (
      SELECT COALESCE(json_object_agg(tool, cnt), '{}')
      FROM (
        SELECT tool, COUNT(*) AS cnt
        FROM public.presubly_usage
        GROUP BY tool ORDER BY cnt DESC
      ) t
    ),

    'recent_feedback', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]')
      FROM (
        SELECT fb.tool, fb.rating, fb.comment,
               u.email::TEXT, p.full_name, fb.created_at
        FROM public.presubly_feedback fb
        JOIN auth.users u ON u.id = fb.user_id
        LEFT JOIN public.profiles p ON p.id = fb.user_id
        ORDER BY fb.created_at DESC LIMIT 20
      ) f
    ),

    'daily_usage', (
      SELECT COALESCE(json_agg(row_to_json(d)), '[]')
      FROM (
        SELECT DATE(created_at) AS day, COUNT(*) AS count
        FROM public.presubly_usage
        WHERE created_at > NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at) ORDER BY day DESC
      ) d
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ┌─────────────────────────────────────────────────────┐
-- │  10. KULLANICI ISTATISTIKLERI                       │
-- └─────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.psb_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_reviews',    (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id AND tool = 'review'),
    'total_editorial',  (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id AND tool = 'editorial'),
    'total_responses',  (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id AND tool = 'response'),
    'total_checklists', (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id AND tool = 'checklist'),
    'total_usage',      (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id),

    'recent_activity', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]')
      FROM (
        SELECT tool, credits_used, created_at
        FROM public.presubly_usage
        WHERE user_id = p_user_id
        ORDER BY created_at DESC LIMIT 10
      ) a
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ┌─────────────────────────────────────────────────────┐
-- │  11. ESKI DEDUCT_CREDITS (UYUMLULUK)                │
-- └─────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id  UUID,
  p_amount   INTEGER,
  p_tool_key TEXT DEFAULT 'unknown'
)
RETURNS VOID AS $$
BEGIN
  PERFORM public.psb_deduct_credits(p_user_id, p_amount, p_tool_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ┌─────────────────────────────────────────────────────┐
-- │  12. GERI BILDIRIM EKLEME FONKSIYONU                │
-- └─────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.psb_add_feedback(
  p_user_id UUID,
  p_tool    TEXT,
  p_rating  INTEGER,
  p_comment TEXT DEFAULT ''
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.presubly_feedback (user_id, tool, rating, comment)
  VALUES (p_user_id, p_tool, p_rating, p_comment);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- TAMAMLANDI!
--
-- TABLOLAR:
--   profiles          — Kullanici profilleri
--   presubly_usage    — Arac kullanim kayitlari
--   presubly_feedback — Geri bildirimler
--
-- FONKSIYONLAR:
--   handle_new_user()      — Trigger: yeni kayit = 3 kredi
--   psb_deduct_credits()   — Kredi dus + kullanim kaydet
--   psb_refund_credits()   — Kredi iade
--   psb_user_stats()       — Kullanici istatistikleri
--   psb_add_feedback()     — Geri bildirim ekle
--   admin_list_users()     — Admin: kullanici listesi
--   admin_delete_user()    — Admin: kullanici sil
--   admin_get_stats()      — Admin: platform istatistikleri
--   deduct_credits()       — Geriye uyumluluk
-- ═══════════════════════════════════════════════════════════════
