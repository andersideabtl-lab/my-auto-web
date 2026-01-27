'use client'

import { useState } from 'react'
import PhaseList from './PhaseList'
import ProgressDashboard from './ProgressDashboard'

interface ExecuteBotProps {
  projectId: string
  projectOverview: any
}

export default function ExecuteBot({
  projectId,
  projectOverview,
}: ExecuteBotProps) {
  const [view, setView] = useState<'phases' | 'dashboard'>('phases')

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              실행 관리
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Phase와 Task를 관리하고 진행 상황을 추적하세요
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('phases')}
              className={`px-4 py-2 rounded-lg transition ${
                view === 'phases'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Phase 목록
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-lg transition ${
                view === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              진행률 대시보드
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {view === 'phases' ? (
          <PhaseList projectId={projectId} />
        ) : (
          <ProgressDashboard projectId={projectId} />
        )}
      </div>
    </div>
  )
}
