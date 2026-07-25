-- ==============================================================================
-- EHLİYET APP - LİDERLİK TABLOSU (LEADERBOARD) RPC FONKSİYONLARI (GİZLİLİK GÜNCELLEMESİ)
-- Lütfen bu kodları kopyalayıp Supabase SQL Editor'e yapıştırın ve RUN (Çalıştır) deyin.
-- ==============================================================================

-- 1. TABLO GÜNCELLEMESİ (Sütunlar yoksa eklenir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leaderboard_hide_avatar BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leaderboard_nickname TEXT DEFAULT NULL;

-- 1.1. ESKİ KAYITLARI GÜNCELLE (Önceden false olarak kaydedilmişse true'ya çevir)
-- (Sadece ilk kez çalıştırdığınızda etki eder, tüm kullanıcıların fotoğraflarını varsayılan olarak gizler)
UPDATE profiles SET leaderboard_hide_avatar = TRUE WHERE leaderboard_hide_avatar = FALSE OR leaderboard_hide_avatar IS NULL;

-- 2. MEVCUT FONKSİYONLARI KALDIR
DROP FUNCTION IF EXISTS get_leaderboard_success_rate(integer);
DROP FUNCTION IF EXISTS get_leaderboard_activity(integer);

-- 3. BAŞARI ORANI SIRALAMASI (Success Rate)
CREATE OR REPLACE FUNCTION get_leaderboard_success_rate(month_offset INT DEFAULT 0)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    average_score NUMERIC,
    exams_completed BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_date TIMESTAMP;
    end_date TIMESTAMP;
BEGIN
    start_date := date_trunc('month', (CURRENT_DATE - (month_offset || ' months')::interval)::timestamp);
    end_date := start_date + interval '1 month';

    RETURN QUERY
    SELECT 
        p.id AS user_id,
        COALESCE(NULLIF(TRIM(p.leaderboard_nickname), ''), p.full_name) AS full_name,
        CASE WHEN COALESCE(p.leaderboard_hide_avatar, TRUE) = TRUE THEN NULL ELSE p.avatar_url END AS avatar_url,
        ROUND(AVG(qr.score)::numeric, 1) AS average_score,
        COUNT(qr.id) AS exams_completed
    FROM 
        profiles p
    JOIN 
        exam_results qr ON p.id = qr.user_id
    WHERE 
        qr.total_questions >= 50
        AND qr.completed_at >= start_date
        AND qr.completed_at < end_date
    GROUP BY 
        p.id, p.full_name, p.avatar_url, p.leaderboard_nickname, p.leaderboard_hide_avatar
    ORDER BY 
        average_score DESC, 
        exams_completed DESC
    LIMIT 100;
END;
$$;


-- 4. EN ÇOK ÇÖZENLER SIRALAMASI (Activity / Most Solved)
CREATE OR REPLACE FUNCTION get_leaderboard_activity(month_offset INT DEFAULT 0)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_solved BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_date TIMESTAMP;
    end_date TIMESTAMP;
BEGIN
    start_date := date_trunc('month', (CURRENT_DATE - (month_offset || ' months')::interval)::timestamp);
    end_date := start_date + interval '1 month';

    RETURN QUERY
    SELECT 
        p.id AS user_id,
        COALESCE(NULLIF(TRIM(p.leaderboard_nickname), ''), p.full_name) AS full_name,
        CASE WHEN COALESCE(p.leaderboard_hide_avatar, TRUE) = TRUE THEN NULL ELSE p.avatar_url END AS avatar_url,
        SUM(qr.correct_count + qr.wrong_count)::BIGINT AS total_solved
    FROM 
        profiles p
    JOIN 
        exam_results qr ON p.id = qr.user_id
    WHERE 
        qr.completed_at >= start_date
        AND qr.completed_at < end_date
    GROUP BY 
        p.id, p.full_name, p.avatar_url, p.leaderboard_nickname, p.leaderboard_hide_avatar
    HAVING 
        SUM(qr.correct_count + qr.wrong_count) > 0
    ORDER BY 
        total_solved DESC
    LIMIT 100;
END;
$$;
