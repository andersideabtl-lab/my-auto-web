-- 작업 4: projects SELECT 정책 추가
-- Supabase Dashboard → SQL Editor에서 실행

-- 기존 정책이 있으면 제거 후 재생성 (선택)
-- DROP POLICY IF EXISTS "Users can view own projects" ON projects;

CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);
