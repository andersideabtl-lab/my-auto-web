'use client'

import { useState, useEffect } from 'react'
import { Phase, Task } from '@/types/phase'
import TaskList from './TaskList'

interface PhaseListProps {
  projectId: string
}

export default function PhaseList({ projectId }: PhaseListProps) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchPhases = async () => {
    try {
      const response = await fetch(`/api/phases?project_id=${projectId}`)
      if (!response.ok) {
        throw new Error('Phase 목록을 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setPhases(data)
      
      // 첫 번째 Phase 자동 확장
      if (data.length > 0 && expandedPhases.size === 0) {
        setExpandedPhases(new Set([data[0].id]))
      }
    } catch (error) {
      console.error('Error fetching phases:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhases()
  }, [projectId])

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (phases.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <span className="text-3xl">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Phase가 없습니다
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          설계 완료 후 자동으로 Phase가 생성됩니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {phases.map((phase) => (
        <PhaseItem
          key={phase.id}
          phase={phase}
          isExpanded={expandedPhases.has(phase.id)}
          onToggle={() => togglePhase(phase.id)}
          onUpdate={fetchPhases}
          projectOverview={null}
        />
      ))}
    </div>
  )
}

interface PhaseItemProps {
  phase: Phase
  isExpanded: boolean
  onToggle: () => void
  onUpdate: () => void
  projectOverview?: any
}

function PhaseItem({
  phase,
  isExpanded,
  onToggle,
  onUpdate,
  projectOverview,
}: PhaseItemProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      fetchTasks()
    }
  }, [isExpanded, phase.id])

  const fetchTasks = async () => {
    setLoadingTasks(true)
    try {
      const response = await fetch(`/api/tasks?phase_id=${phase.id}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0
    const completed = tasks.filter((t) => t.status === 'done').length
    return Math.round((completed / tasks.length) * 100)
  }

  const progress = calculateProgress(tasks)

  const getStatusColor = (status: Phase['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getStatusText = (status: Phase['status']) => {
    switch (status) {
      case 'completed':
        return '완료'
      case 'in-progress':
        return '진행 중'
      case 'blocked':
        return '차단됨'
      default:
        return '대기 중'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition rounded-xl"
      >
        <div className="flex items-center gap-4 flex-1 text-left">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {phase.phase_number}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {phase.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{phase.duration_weeks}주</span>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(phase.status)}`}>
                {getStatusText(phase.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 진행률 */}
          <div className="w-32">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>진행률</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
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
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
          {loadingTasks ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <TaskList
              phaseId={phase.id}
              tasks={tasks}
              onUpdate={fetchTasks}
              projectOverview={projectOverview}
            />
          )}
        </div>
      )}
    </div>
  )
}
