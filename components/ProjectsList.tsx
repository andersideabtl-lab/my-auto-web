'use client'

import { useState, useEffect, useMemo } from 'react'
import { Project } from '@/types/project'
import ProjectCard from './ProjectCard'
import CreateProjectModal from './CreateProjectModal'
import EmptyProjectsState from './EmptyProjectsState'

interface ProjectsListProps {
  initialProjects?: Project[]
}

type FilterType = 'all' | 'active' | 'completed' | 'blocked'
type SortType = 'recent' | 'name'

export default function ProjectsList({ initialProjects = [] }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [loading, setLoading] = useState(initialProjects.length === 0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('recent')

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('프로젝트를 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialProjects.length === 0) {
      fetchProjects()
    }
  }, [])

  const handleDelete = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id))
  }

  // 필터링 및 정렬
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 상태 필터
    if (filter !== 'all') {
      filtered = filtered.filter((p) => p.status === filter)
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return a.name.localeCompare(b.name, 'ko')
      }
    })

    return sorted
  }, [projects, searchQuery, filter, sort])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <>
      {projects.length > 0 ? (
        <div className="space-y-6">
          {/* 검색 및 필터 바 */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="프로젝트 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* 필터 탭 */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {(['all', 'active', 'completed', 'blocked'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                      filter === f
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {f === 'all'
                      ? '전체'
                      : f === 'active'
                      ? '진행중'
                      : f === 'completed'
                      ? '완료'
                      : '블록'}
                  </button>
                ))}
              </div>

              {/* 정렬 드롭다운 */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none pr-8 cursor-pointer"
                >
                  <option value="recent">최근순</option>
                  <option value="name">이름순</option>
                </select>
                <svg
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* 새 프로젝트 버튼 */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                새 프로젝트
              </button>
            </div>
          </div>

          {/* 프로젝트 그리드 */}
          {filteredAndSortedProjects.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredAndSortedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || filter !== 'all'
                  ? '검색 결과가 없습니다.'
                  : '프로젝트가 없습니다.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <EmptyProjectsState onCreateProject={() => setIsModalOpen(true)} />
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
      />
    </>
  )
}
