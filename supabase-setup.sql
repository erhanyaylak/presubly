-- ═══════════════════════════════════════════════════
-- PRESUBLY — Supabase Veritabani Kurulumu
-- ⚠️ ESKIMIS / SUPERSEDED — bu eski ilk kurulumdur (recursive admin
--    politikasi, kolon korumasi yok). GUNCEL kanonik dosya:
--      1) presubly-supabase-full.sql   (ana kurulum, sertlestirilmis)
--      2) fix-security-rls-2026-06.sql (guvenlik yamasi — mevcut DB icin)
--    Yeni kurulumda bu dosyayi KULLANMA.
-- ═══════════════════════════════════════════════════

-- 1. profiles tablosu (MisanpAIge ile paylasimli, zaten varsa atla)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT DEFAULT '',
  credits INTEGER DEFAULT 3,
  is_admin BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- metadata kolonu yoksa ekle
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- RLS politikalari
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kullanici kendi profilini okuyabilir
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Kullanici kendi profilini guncelleyebilir
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin herkesi okuyabilir
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Admin herkesi guncelleyebilir
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );


-- 2. Yeni kayit olunca otomatik profil olustur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, credits, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    3,  -- 3 ucretsiz kredi
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (zaten varsa once sil)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. Presubly kullanim takip tablosu
CREATE TABLE IF NOT EXISTS public.presubly_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,  -- 'review', 'editorial', 'response', 'checklist'
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.presubly_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own usage" ON public.presubly_usage;
CREATE POLICY "Users read own usage" ON public.presubly_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own usage" ON public.presubly_usage;
CREATE POLICY "Users insert own usage" ON public.presubly_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all usage" ON public.presubly_usage;
CREATE POLICY "Admins read all usage" ON public.presubly_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );


-- 4. Presubly geri bildirim tablosu
CREATE TABLE IF NOT EXISTS public.presubly_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.presubly_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own feedback" ON public.presubly_feedback;
CREATE POLICY "Users insert own feedback" ON public.presubly_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all feedback" ON public.presubly_feedback;
CREATE POLICY "Admins read all feedback" ON public.presubly_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );


-- 5. Kredi dusme fonksiyonu
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Yetersiz kredi';
  END IF;

  -- Kullanim kaydini ekle
  INSERT INTO public.presubly_usage (user_id, tool, credits_used)
  VALUES (p_user_id, 'unknown', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Presubly icin gelismis kredi dusme (arac adi ile)
CREATE OR REPLACE FUNCTION public.psb_deduct_credits(p_user_id UUID, p_amount INTEGER, p_tool TEXT)
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


-- 7. Admin: Kullanici listesi
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  credits INTEGER,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Sadece admin calistirabilir
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE) THEN
    RAISE EXCEPTION 'Yetkisiz erisim';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::TEXT,
    p.full_name,
    p.credits,
    p.is_admin,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Admin: Platform istatistikleri
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Sadece admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE) THEN
    RAISE EXCEPTION 'Yetkisiz erisim';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_usage', (SELECT COUNT(*) FROM public.presubly_usage),
    'total_feedback', (SELECT COUNT(*) FROM public.presubly_feedback),
    'avg_rating', (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.presubly_feedback),
    'usage_by_tool', (
      SELECT COALESCE(json_object_agg(tool, cnt), '{}')
      FROM (
        SELECT tool, COUNT(*) as cnt
        FROM public.presubly_usage
        GROUP BY tool
        ORDER BY cnt DESC
      ) t
    ),
    'recent_feedback', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]')
      FROM (
        SELECT
          fb.tool,
          fb.rating,
          fb.comment,
          u.email::TEXT,
          p.full_name,
          fb.created_at
        FROM public.presubly_feedback fb
        JOIN auth.users u ON u.id = fb.user_id
        LEFT JOIN public.profiles p ON p.id = fb.user_id
        ORDER BY fb.created_at DESC
        LIMIT 20
      ) f
    ),
    'daily_usage', (
      SELECT COALESCE(json_agg(row_to_json(d)), '[]')
      FROM (
        SELECT
          DATE(created_at) as day,
          COUNT(*) as count
        FROM public.presubly_usage
        WHERE created_at > NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        ORDER BY day DESC
      ) d
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Kullanici kendi Presubly istatistiklerini gorsun
CREATE OR REPLACE FUNCTION public.psb_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_reviews', (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id AND tool = 'review'),
    'total_editorial', (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id AND tool = 'editorial'),
    'total_responses', (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id AND tool = 'response'),
    'total_checklists', (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id AND tool = 'checklist'),
    'total_usage', (SELECT COUNT(*) FROM public.presubly_usage WHERE user_id = p_user_id),
    'recent_activity', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]')
      FROM (
        SELECT tool, credits_used, created_at
        FROM public.presubly_usage
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
      ) a
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════
-- TAMAMLANDI
-- Tablolar: profiles, presubly_usage, presubly_feedback
-- Fonksiyonlar: handle_new_user, deduct_credits, psb_deduct_credits,
--               admin_list_users, admin_get_stats, psb_user_stats
-- ═══════════════════════════════════════════════════
