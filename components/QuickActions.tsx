'use client'

import { useRouter } from 'next/navigation'

interface QuickActionsProps {
  onNewProject: () => void
}

export default function QuickActions({ onNewProject }: QuickActionsProps) {
  const router = useRouter()

  const actions = [
    {
      label: '새 프로젝트',
      description: '설계봇으로 시작',
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      onClick: onNewProject,
      color: 'indigo',
    },
    {
      label: 'API 키 관리',
      description: '서비스 연결',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      ),
      onClick: () => {
        router.push('/settings/credentials')
      },
      color: 'purple',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all text-left group ${
            action.color === 'indigo'
              ? 'hover:border-indigo-300 dark:hover:border-indigo-600'
              : 'hover:border-purple-300 dark:hover:border-purple-600'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg group-hover:scale-110 transition-transform ${
                action.color === 'indigo'
                  ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
              }`}
            >
              {action.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {action.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {action.description}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition"
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
        </button>
      ))}
    </div>
  )
}
