-- 관리자 역할 수정 스크립트
-- 사용 전 아래 'your_admin_email@example.com'을 실제 관리자 이메일로 교체하세요

-- 1. 먼저 해당 사용자의 ID 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'your_admin_email@example.com';

-- 2. public.users 테이블에 레코드가 있는지 확인
SELECT u.id, u.role, au.email
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'your_admin_email@example.com';

-- 3. 레코드가 없으면 추가, 있으면 업데이트
-- 아래 쿼리에서 '사용자UUID'를 위의 1번 쿼리 결과의 id로 교체하세요
-- 또는 직접 이메일로 찾아서 업데이트:

-- 방법 A: UPSERT (레코드가 있으면 업데이트, 없으면 추가)
INSERT INTO public.users (id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'your_admin_email@example.com'
ON CONFLICT (id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- 방법 B: 직접 ID로 업데이트 (위의 1번 쿼리 결과의 id 사용)
-- UPDATE public.users 
-- SET role = 'admin', updated_at = NOW()
-- WHERE id = '사용자UUID';

-- 4. 확인
SELECT 
  u.id,
  u.role,
  au.email,
  u.created_at,
  u.updated_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'your_admin_email@example.com';
