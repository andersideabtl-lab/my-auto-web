-- projects 테이블에 creation_mode와 uploaded_file_path 컬럼 추가
-- Supabase Dashboard > SQL Editor에서 실행하거나 마이그레이션으로 적용

ALTER TABLE projects ADD COLUMN IF NOT EXISTS creation_mode TEXT CHECK (creation_mode IN ('new', 'doc', 'resume'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS uploaded_file_path TEXT;

-- 기존 프로젝트는 'new'로 설정
UPDATE projects SET creation_mode = 'new' WHERE creation_mode IS NULL;
