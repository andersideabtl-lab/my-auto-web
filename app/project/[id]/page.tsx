import { createClient } from '@/lib/supabase/server'
import { safeParseJSON } from '@/lib/json-utils'
import { redirect, notFound } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ProjectTabs from '@/components/ProjectTabs'
import ProjectDocuments from '@/components/ProjectDocuments'

interface ProjectPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ section?: string; file?: string }>
}

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { id } = await params
  const { section, file } = await searchParams

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 프로젝트 정보 가져오기
  console.log('[PROJECT PAGE] Fetching project:', { id, userId: user.id, userEmail: user.email })
  
  // 직접 프로젝트 조회 시도 (RLS 정책 적용)
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    console.error('[PROJECT PAGE] Error fetching project:', {
      error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    
    // 에러 발생 시 대시보드로 리다이렉트
    redirect('/dashboard')
  }
  
  if (!project) {
    console.error('[PROJECT PAGE] Project not found:', id)
    notFound()
  }
  
  console.log('[PROJECT PAGE] Project found:', { 
    id: project.id, 
    name: project.name,
    userId: project.user_id,
    creationMode: (project as any).creation_mode,
  })
  // creation_mode에 따라 기본 섹션 결정
  const defaultSection = (project as any).creation_mode === 'doc' || (project as any).creation_mode === 'resume'
    ? 'analysis'
    : 'design'
  
  const activeSection =
    (section as 'analysis' | 'design' | 'execute' | 'supervise' | 'audit' | 'documents') || defaultSection
  const selectedFileIndex = file ? parseInt(file as string) : null

  // description이 JSON 문자열인 경우 파싱
  let projectOverview = null
  if (project.description && project.description.trim()) {
    try {
      projectOverview = safeParseJSON(project.description, false)
    } catch {
      // JSON이 아닌 경우 무시
      projectOverview = null
    }
  }

  // document_files 파싱
  let documentFiles: any[] = []
  if (project.document_files) {
    try {
      documentFiles =
        typeof project.document_files === 'string'
          ? safeParseJSON(project.document_files)
          : project.document_files
    } catch {
      documentFiles = []
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* 사이드바 */}
      <Sidebar
        projectId={id}
        activeSection={activeSection}
        documentFiles={documentFiles}
      />

      {/* 메인 영역 */}
      <div className="ml-[250px] flex-1 flex flex-col">
        {/* 헤더 */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-800">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            {projectOverview && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {projectOverview.summary || '프로젝트 상세'}
              </p>
            )}
          </div>
        </header>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-hidden">
          {activeSection === 'documents' ? (
            <ProjectDocuments
              projectId={id}
              documentFiles={documentFiles}
              initialFileIndex={selectedFileIndex}
            />
          ) : (
            <ProjectTabs
              projectId={id}
              activeSection={activeSection}
              initialOverview={projectOverview}
              creationMode={(project as any).creation_mode}
              uploadedFilePath={(project as any).uploaded_file_path}
            />
          )}
        </div>
      </div>
    </div>
  )
}
