-- 관리자 계정 확인 쿼리
-- Supabase SQL Editor에서 실행하세요

-- 방법 1: users 테이블에서 관리자 확인
SELECT 
  u.id,
  u.role,
  u.created_at,
  au.email,
  au.created_at as auth_created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'admin'
ORDER BY u.created_at ASC;

-- 방법 2: 모든 사용자와 역할 확인
SELECT 
  u.id,
  u.role,
  u.created_at,
  au.email,
  au.created_at as auth_created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at ASC;

-- 방법 3: 첫 번째 사용자 확인 (관리자일 가능성이 높음)
SELECT 
  au.id,
  au.email,
  au.created_at,
  COALESCE(u.role, 'user') as role
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at ASC
LIMIT 1;
