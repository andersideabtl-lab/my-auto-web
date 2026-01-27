-- 현재 관리자 계정 확인 쿼리
-- Supabase SQL Editor에서 실행하세요

-- 방법 1: 관리자 계정과 이메일 확인
SELECT 
  u.id as user_id,
  u.role,
  u.created_at as role_created_at,
  au.email,
  au.created_at as account_created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'admin'
ORDER BY u.created_at ASC;

-- 방법 2: 첫 번째 사용자 확인 (관리자일 가능성이 높음)
SELECT 
  au.id,
  au.email,
  au.created_at,
  COALESCE(u.role, 'user') as role,
  CASE 
    WHEN u.role = 'admin' THEN '✅ 관리자'
    ELSE '❌ 일반 사용자'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at ASC
LIMIT 1;

-- 방법 3: 모든 사용자와 역할 확인
SELECT 
  au.email,
  au.created_at as 가입일,
  COALESCE(u.role, 'user') as 역할,
  CASE 
    WHEN u.role = 'admin' THEN '✅'
    ELSE ''
  END as 관리자여부
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at ASC;
