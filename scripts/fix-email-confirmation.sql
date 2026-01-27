-- 이메일 인증 완료 처리 스크립트
-- 특정 사용자의 이메일 인증을 완료합니다

-- 방법 1: 특정 이메일의 인증 완료
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'your-email@example.com';

-- 방법 2: 모든 사용자의 인증 완료 (개발 환경용)
-- ⚠️ 프로덕션에서는 사용하지 마세요!
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 방법 3: 특정 사용자 ID로 인증 완료
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE id = 'user-uuid-here';

-- 확인
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';
