-- 사용자 레코드 자동 생성 함수
-- public.users 테이블에 레코드가 없을 때 자동으로 생성

-- RLS 정책 확인 및 수정
-- 사용자가 자신의 레코드를 INSERT할 수 있도록 정책 추가

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- 사용자는 자신의 레코드를 생성할 수 있음
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 기존 사용자 레코드가 없는 경우 생성
-- auth.users에 있지만 public.users에 없는 사용자 처리
INSERT INTO public.users (id, role, created_at, updated_at)
SELECT 
  au.id,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.users) = 0 THEN 'admin'
    ELSE 'user'
  END as role,
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 확인
SELECT 
  u.id,
  u.role,
  au.email,
  u.created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at ASC;
