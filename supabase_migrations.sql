-- users 테이블에 role 컬럼 추가
-- Supabase는 auth.users를 직접 수정할 수 없으므로, 별도 users 테이블 생성 또는 metadata 사용

-- 방법 1: auth.users의 raw_user_meta_data에 role 저장 (권장)
-- 이미 auth.users가 있으므로 metadata 사용

-- 방법 2: 별도 users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 첫 사용자 자동 admin 설정 (트리거)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 첫 사용자인지 확인
  IF (SELECT COUNT(*) FROM public.users) = 0 THEN
    INSERT INTO public.users (id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.users (id, role)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 기존 사용자 처리 (첫 사용자 admin으로)
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF first_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, role)
    VALUES (first_user_id, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END $$;

-- credentials 테이블에 is_shared 컬럼 추가
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- RLS 정책 업데이트
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 볼 수 있음
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 관리자 체크 함수 (SECURITY DEFINER로 RLS 우회)
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

-- 관리자만 모든 사용자 정보 볼 수 있음 (재귀 없음)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin(auth.uid())
  );

-- 사용자는 자신의 레코드를 생성할 수 있음 (자동 생성용)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- projects 테이블에 creation_mode와 uploaded_file_path 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS creation_mode TEXT CHECK (creation_mode IN ('new', 'doc', 'resume'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS uploaded_file_path TEXT;
