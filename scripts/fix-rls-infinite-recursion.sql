-- RLS 무한 재귀 문제 해결 스크립트

-- 1. 기존 관리자 정책 삭제 (무한 재귀 원인)
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- 2. SECURITY DEFINER 함수로 관리자 체크 (재귀 없음)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER로 실행되므로 RLS를 우회하여 직접 조회
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- 3. 새로운 관리자 정책 (함수 사용, 재귀 없음)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin(auth.uid())
  );

-- 4. 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
