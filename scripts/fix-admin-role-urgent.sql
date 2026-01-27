-- 긴급: 관리자 계정 설정
-- Supabase SQL Editor에서 실행하세요. 'your_admin_email@example.com'을 실제 관리자 이메일로 교체하세요.

-- 1. 현재 상태 확인
SELECT 
  u.id,
  u.role,
  au.email,
  u.created_at,
  u.updated_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'your_admin_email@example.com';

-- 2. 관리자로 설정 (UPSERT - 있으면 업데이트, 없으면 추가)
INSERT INTO public.users (id, role, created_at, updated_at)
SELECT 
  id, 
  'admin',
  created_at,
  NOW()
FROM auth.users 
WHERE email = 'your_admin_email@example.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 3. 확인
SELECT 
  u.id,
  u.role,
  au.email,
  u.created_at,
  u.updated_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'your_admin_email@example.com';

-- 4. RLS 정책 확인 (자신의 레코드는 조회 가능해야 함)
-- 다음 정책이 있어야 합니다:
-- "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
