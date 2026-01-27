'use client'

import { Project } from '@/types/project'
import { useRouter } from 'next/navigation'

interface RecentActivityProps {
  projects: Project[]
}

export default function RecentActivity({ projects }: RecentActivityProps) {
  const router = useRouter()

  // 최근 5개 프로젝트 (생성일 기준)
  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    if (days < 30) return `${Math.floor(days / 7)}주 전`
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    })
  }

  if (recentProjects.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        최근 활동
      </h3>
      <div className="space-y-3">
        {recentProjects.map((project, index) => (
          <div
            key={project.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
            onClick={() => router.push(`/project/${project.id}`)}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {project.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(project.created_at)}
              </p>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 rounded">
              {project.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
