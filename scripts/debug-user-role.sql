-- 사용자 역할 디버깅 스크립트

-- 1. 현재 인증된 사용자 확인
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at ASC;

-- 2. public.users 테이블 확인
SELECT 
  id,
  role,
  created_at,
  updated_at
FROM public.users
ORDER BY created_at ASC;

-- 3. 특정 사용자 확인 (user_id를 실제 ID로 변경)
-- SELECT * FROM public.users WHERE id = '1d66804a-3066-4929-9228-a2b45a1d5a99';

-- 4. RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- 5. 수동으로 사용자 레코드 생성 (필요시)
-- INSERT INTO public.users (id, role)
-- VALUES ('1d66804a-3066-4929-9228-a2b45a1d5a99', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 6. 첫 사용자를 admin으로 설정
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);
