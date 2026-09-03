-- ═══════════════════════════════════════════════════
-- PRESUBLY — Admin paneli sadece Presubly kullanicilarini gostersin
-- ═══════════════════════════════════════════════════

-- 1. Yeni kayit trigger'ina signupSource ekle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  src TEXT := COALESCE(NEW.raw_user_meta_data->>'signupSource', 'unknown');
BEGIN
  INSERT INTO public.profiles (id, full_name, credits, is_admin, metadata)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    3,
    FALSE,
    jsonb_build_object('signupSource', src)
  )
  ON CONFLICT (id) DO UPDATE SET
    metadata = COALESCE(public.profiles.metadata,'{}'::jsonb) ||
               jsonb_build_object('signupSource',
                 COALESCE(public.profiles.metadata->>'signupSource', src));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. admin_list_users — sadece Presubly kullanicilari
DROP FUNCTION IF EXISTS public.admin_list_users();
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
  WHERE
    -- Presubly'den kayit olanlar
    p.metadata->>'signupSource' = 'presubly'
    OR
    -- veya Presubly aracini en az bir kez kullanmis olanlar
    EXISTS (SELECT 1 FROM public.presubly_usage WHERE user_id = p.id)
    OR
    -- veya admin
    p.is_admin = TRUE
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. admin_get_stats — sadece Presubly verisi (zaten presubly_usage tablosundan cekiyor)
DROP FUNCTION IF EXISTS public.admin_get_stats();
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
    'total_users', (
      SELECT COUNT(*) FROM public.profiles p
      WHERE p.metadata->>'signupSource' = 'presubly'
         OR EXISTS (SELECT 1 FROM public.presubly_usage WHERE user_id = p.id)
    ),
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

-- 4. Mevcut Presubly kullanicilarini isaretle (presubly_usage'de kaydi olanlar)
UPDATE public.profiles
SET metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('signupSource','presubly')
WHERE id IN (SELECT DISTINCT user_id FROM public.presubly_usage)
  AND (metadata->>'signupSource' IS NULL OR metadata->>'signupSource' != 'presubly');
