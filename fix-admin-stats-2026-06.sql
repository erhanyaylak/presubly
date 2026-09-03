-- ═══════════════════════════════════════════════════════════════
-- PRESUBLY — ADMIN KPI GENISLETME (MisanpAIge tarzi panel icin)
-- Tarih: 2026-06-15
-- Supabase Dashboard > SQL Editor > yapistir > Run
-- Idempotent. is_admin() yardimcisi gerektirir (full setup veya
-- fix-security-rls-2026-06.sql ile gelir).
-- ═══════════════════════════════════════════════════════════════

-- Calisma maliyet tahmini (Sonnet 4, ortalama ~4.5k token / calisma).
-- Sadece bir TAHMIN; gercek fatura Anthropic konsolundadir.
-- $/calisma ~ 0.03

-- ┌─────────────────────────────────────────────────────┐
-- │  ADMIN: PLATFORM ISTATISTIKLERI (genis KPI seti)    │
-- └─────────────────────────────────────────────────────┘
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_active7d   INT;
  v_signups30d INT;
  v_prior_active INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz erisim';
  END IF;

  SELECT COUNT(DISTINCT user_id) INTO v_active7d
  FROM public.presubly_usage
  WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '7 days';

  SELECT COUNT(*) INTO v_signups30d
  FROM public.profiles WHERE created_at > NOW() - INTERVAL '30 days';

  SELECT COUNT(DISTINCT user_id) INTO v_prior_active
  FROM public.presubly_usage
  WHERE credits_used > 0
    AND created_at > NOW() - INTERVAL '14 days'
    AND created_at <= NOW() - INTERVAL '7 days';

  SELECT json_build_object(
    -- Kullanici metrikleri
    'total_users',   (SELECT COUNT(*) FROM public.profiles),
    'total_admins',  (SELECT COUNT(*) FROM public.profiles WHERE is_admin),
    'active_7d',     v_active7d,
    'dau',           (SELECT COUNT(DISTINCT user_id) FROM public.presubly_usage
                      WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '24 hours'),
    'new_24h',       (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '24 hours'),
    'new_7d',        (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '7 days'),

    -- Calisma metrikleri
    'total_runs',    (SELECT COUNT(*) FROM public.presubly_usage WHERE credits_used > 0),
    'runs_7d',       (SELECT COUNT(*) FROM public.presubly_usage
                      WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '7 days'),
    'runs_prev_7d',  (SELECT COUNT(*) FROM public.presubly_usage
                      WHERE credits_used > 0
                        AND created_at > NOW() - INTERVAL '14 days'
                        AND created_at <= NOW() - INTERVAL '7 days'),
    'avg_per_active', (
      SELECT CASE WHEN v_active7d > 0 THEN ROUND(
        (SELECT COUNT(*) FROM public.presubly_usage
         WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '7 days')::numeric
        / v_active7d, 1) ELSE 0 END
    ),
    'peak_hour', (
      SELECT EXTRACT(HOUR FROM created_at)::int
      FROM public.presubly_usage
      WHERE credits_used > 0
      GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 1
    ),

    -- Kalite / saglik metrikleri (%)
    'power_pct', (
      SELECT CASE WHEN v_active7d > 0 THEN ROUND(100.0 * (
        SELECT COUNT(*) FROM (
          SELECT user_id FROM public.presubly_usage
          WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '7 days'
          GROUP BY user_id HAVING COUNT(*) >= 5
        ) p
      ) / v_active7d) ELSE 0 END
    ),
    'retention_pct', (
      SELECT CASE WHEN v_prior_active > 0 THEN ROUND(100.0 * (
        SELECT COUNT(*) FROM (
          SELECT DISTINCT user_id FROM public.presubly_usage
          WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '7 days'
          INTERSECT
          SELECT DISTINCT user_id FROM public.presubly_usage
          WHERE credits_used > 0
            AND created_at > NOW() - INTERVAL '14 days'
            AND created_at <= NOW() - INTERVAL '7 days'
        ) r
      ) / v_prior_active) ELSE 0 END
    ),
    'activation_pct', (
      SELECT CASE WHEN v_signups30d > 0 THEN ROUND(100.0 * (
        SELECT COUNT(*) FROM public.profiles p
        WHERE p.created_at > NOW() - INTERVAL '30 days'
          AND EXISTS (SELECT 1 FROM public.presubly_usage u
                      WHERE u.user_id = p.id AND u.credits_used > 0)
      ) / v_signups30d) ELSE 0 END
    ),
    'signups_30d', v_signups30d,

    -- Maliyet / kredi
    'credits_7d', (SELECT COALESCE(SUM(credits_used), 0) FROM public.presubly_usage
                   WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '7 days'),
    'est_cost_7d', (SELECT ROUND(0.03 * COUNT(*), 2) FROM public.presubly_usage
                    WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '7 days'),

    -- Geri bildirim
    'total_feedback', (SELECT COUNT(*) FROM public.presubly_feedback),
    'avg_rating',     (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.presubly_feedback),

    -- Dagilimlar / listeler
    'usage_by_tool', (
      SELECT COALESCE(json_object_agg(tool, cnt), '{}')
      FROM (SELECT tool, COUNT(*) AS cnt FROM public.presubly_usage
            WHERE credits_used > 0 GROUP BY tool ORDER BY cnt DESC) t
    ),
    'recent_feedback', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]')
      FROM (SELECT fb.tool, fb.rating, fb.comment, u.email::TEXT, p.full_name, fb.created_at
            FROM public.presubly_feedback fb
            JOIN auth.users u ON u.id = fb.user_id
            LEFT JOIN public.profiles p ON p.id = fb.user_id
            ORDER BY fb.created_at DESC LIMIT 30) f
    ),
    'daily_usage', (
      SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.day), '[]')
      FROM (SELECT DATE(created_at) AS day, COUNT(*) AS count
            FROM public.presubly_usage
            WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '14 days'
            GROUP BY DATE(created_at)) d
    ),
    'recent_users', (
      SELECT COALESCE(json_agg(row_to_json(ru)), '[]')
      FROM (SELECT p.id, p.full_name, u.email::TEXT, p.is_admin, p.created_at
            FROM public.profiles p JOIN auth.users u ON u.id = p.id
            ORDER BY p.created_at DESC LIMIT 8) ru
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ┌─────────────────────────────────────────────────────┐
-- │  ADMIN: KULLANICI LISTESI (calisma sayilariyla)     │
-- └─────────────────────────────────────────────────────┘
-- RETURNS TABLE imzasi degisti → once DROP gerekiyor.
DROP FUNCTION IF EXISTS public.admin_list_users();
CREATE FUNCTION public.admin_list_users()
RETURNS TABLE(
  id          UUID,
  email       TEXT,
  full_name   TEXT,
  credits     INTEGER,
  is_admin    BOOLEAN,
  created_at  TIMESTAMPTZ,
  total_runs  BIGINT,
  runs_7d     BIGINT,
  last_active TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz erisim';
  END IF;

  RETURN QUERY
  SELECT
    p.id, u.email::TEXT, p.full_name, p.credits, p.is_admin, p.created_at,
    COALESCE(s.total_runs, 0) AS total_runs,
    COALESCE(s.runs_7d, 0)    AS runs_7d,
    s.last_active
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN (
    SELECT user_id,
           COUNT(*) FILTER (WHERE credits_used > 0) AS total_runs,
           COUNT(*) FILTER (WHERE credits_used > 0 AND created_at > NOW() - INTERVAL '7 days') AS runs_7d,
           MAX(created_at) AS last_active
    FROM public.presubly_usage
    GROUP BY user_id
  ) s ON s.user_id = p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- TAMAMLANDI. admin_get_stats artik 20+ alan, admin_list_users
-- kullanici basina total_runs / runs_7d / last_active dondurur.
-- ═══════════════════════════════════════════════════════════════
