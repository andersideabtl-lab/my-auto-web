'use client'

import { useState } from 'react'
import { Task } from '@/types/phase'

interface TaskGuideProps {
  task: Task
  projectOverview?: any
}

export default function TaskGuide({ task, projectOverview }: TaskGuideProps) {
  const [guide, setGuide] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchGuide = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tasks/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName: task.name,
          taskType: task.type,
          completionCriteria: task.completion_criteria,
          projectOverview,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGuide(data.guide)
      }
    } catch (error) {
      console.error('가이드 생성 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!guide && !loading) {
    return (
      <button
        onClick={fetchGuide}
        className="w-full px-4 py-2 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg transition"
      >
        💡 실행 가이드 보기
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">
          💡 실행 가이드
        </h4>
        <button
          onClick={() => setGuide(null)}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="text-sm text-indigo-800 dark:text-indigo-300 whitespace-pre-wrap">
        {guide}
      </div>
    </div>
  )
}
