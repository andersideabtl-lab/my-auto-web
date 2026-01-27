'use client'

import { Project } from '@/types/project'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UserAvatar from './UserAvatar'

interface ProjectCardProps {
  project: Project
  onDelete: (id: string) => void
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [phases, setPhases] = useState<any[]>([])
  const [currentPhase, setCurrentPhase] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Phase 정보 가져오기
    fetch(`/api/phases?project_id=${project.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPhases(data)
          const inProgress = data.filter((p: any) => p.status === 'in-progress')
          if (inProgress.length > 0) {
            setCurrentPhase(inProgress[0].phase_number || 0)
          } else {
            const completed = data.filter((p: any) => p.status === 'completed')
            setCurrentPhase(completed.length)
          }
        }
      })
      .catch(() => {})
  }, [project.id])

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '삭제에 실패했습니다.')
      }

      onDelete(project.id)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsDeleting(false)
      setIsMenuOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: {
        text: '진행중',
        className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      },
      completed: {
        text: '완료',
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      },
      blocked: {
        text: '블록',
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      },
    }
    return badges[status as keyof typeof badges] || badges.active
  }

  const statusBadge = getStatusBadge(project.status)
  const totalPhases = phases.length || 0
  const progressPercent = totalPhases > 0 ? Math.round((currentPhase / totalPhases) * 100) : 0

  return (
    <div
      onClick={() => router.push(`/project/${project.id}`)}
      className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 cursor-pointer overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(to bottom right, transparent, transparent), linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
      }}
    >
      {/* 상단: 아이콘 + 상태배지 + 메뉴 */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-md border ${statusBadge.className}`}
          >
            {statusBadge.text}
          </span>
        </div>

        {/* 메뉴 버튼 */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {/* 드롭다운 메뉴 */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMenuOpen(false)
                }}
              />
              <div className="absolute right-0 top-8 z-20 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 프로젝트명 */}
      <div className="px-6 pb-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {project.description}
          </p>
        )}
      </div>

      {/* 진행 정보 */}
      {totalPhases > 0 && (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Phase {currentPhase}/{totalPhases}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 하단: 아바타 + 날짜 */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {project.creator_email && (
            <UserAvatar
              email={project.creator_email}
              size="sm"
              showTooltip={true}
            />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(project.created_at)}
          </span>
        </div>
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  )
}
