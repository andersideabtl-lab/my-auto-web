import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserProfile from '@/components/UserProfile'
import DashboardStats from '@/components/DashboardStats'
import DashboardClient from '@/components/DashboardClient'
import RecentActivity from '@/components/RecentActivity'
import ProjectsList from '@/components/ProjectsList'
import { getUserRole } from '@/lib/auth-helpers'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 프로젝트 목록 가져오기
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 각 프로젝트에 생성자 이메일 추가
  const projectsList = (projects || []).map((project) => ({
    ...project,
    creator_email: user.email || null,
  }))

  // 사용자명 추출 (이메일에서 @ 앞부분)
  const userName = user.email?.split('@')[0] || '사용자'
  
  // 관리자 여부 확인 (실시간 DB 조회, 캐싱 없음)
  const userRole = await getUserRole()
  const isAdmin = userRole === 'admin'
  
  // 디버깅: 권한 정보 로깅
  console.log(`[DASHBOARD] User: ${user.email}, Role: ${userRole}, IsAdmin: ${isAdmin}`)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                환영합니다, {userName}님! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                오늘도 프로젝트를 성공적으로 완료해보세요
              </p>
            </div>
            <UserProfile user={{ email: user.email || '', id: user.id }} isAdmin={isAdmin} />
          </div>

          {/* 통계 카드 */}
          <DashboardStats projects={projectsList} />

          {/* 프로젝트 목록 */}
          <ProjectsList initialProjects={projectsList} />
        </div>
      </div>
    </div>
  )
}
