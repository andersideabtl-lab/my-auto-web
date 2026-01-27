'use client'

import { useState, useEffect } from 'react'
import { Phase, Task } from '@/types/phase'

interface ProgressDashboardProps {
  projectId: string
}

export default function ProgressDashboard({ projectId }: ProgressDashboardProps) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      // Phase 목록 가져오기
      const phasesResponse = await fetch(`/api/phases?project_id=${projectId}`)
      if (phasesResponse.ok) {
        const phasesData = await phasesResponse.json()
        setPhases(phasesData)

        // 모든 Phase의 Task 가져오기
        const tasksPromises = phasesData.map((phase: Phase) =>
          fetch(`/api/tasks?phase_id=${phase.id}`).then((r) => r.json())
        )
        const tasksArrays = await Promise.all(tasksPromises)
        const allTasksData = tasksArrays.flat()
        setAllTasks(allTasksData)
      }
    } catch (error) {
      console.error('데이터 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateOverallProgress = () => {
    if (allTasks.length === 0) return 0
    const completed = allTasks.filter((t) => t.status === 'done').length
    return Math.round((completed / allTasks.length) * 100)
  }

  const calculatePhaseProgress = (phaseId: string) => {
    const phaseTasks = allTasks.filter((t) => t.phase_id === phaseId)
    if (phaseTasks.length === 0) return 0
    const completed = phaseTasks.filter((t) => t.status === 'done').length
    return Math.round((completed / phaseTasks.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const overallProgress = calculateOverallProgress()

  return (
    <div className="space-y-6">
      {/* 전체 진행률 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          전체 진행률
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              완료된 태스크
            </span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {overallProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {allTasks.filter((t) => t.status === 'done').length} / {allTasks.length} 태스크 완료
          </div>
        </div>
      </div>

      {/* Phase별 진행률 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Phase별 진행률
        </h3>
        <div className="space-y-4">
          {phases.map((phase) => {
            const progress = calculatePhaseProgress(phase.id)
            const phaseTasks = allTasks.filter((t) => t.phase_id === phase.id)
            const completed = phaseTasks.filter((t) => t.status === 'done').length

            return (
              <div key={phase.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Phase {phase.phase_number}: {phase.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {completed} / {phaseTasks.length} 태스크 완료
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {phases.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Phase</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {allTasks.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">전체 태스크</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {allTasks.filter((t) => t.status === 'done').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">완료</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {allTasks.filter((t) => t.status === 'in-progress').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">진행 중</div>
        </div>
      </div>
    </div>
  )
}
