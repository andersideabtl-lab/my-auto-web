'use client'

import { useState } from 'react'
import { Task } from '@/types/phase'
import TaskGuide from './TaskGuide'

interface TaskListProps {
  phaseId: string
  tasks: Task[]
  onUpdate: () => void
  projectOverview?: any
}

export default function TaskList({
  phaseId,
  tasks,
  onUpdate,
  projectOverview,
}: TaskListProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const handleTaskToggle = async (taskId: string, currentStatus: Task['status']) => {
    const newStatus =
      currentStatus === 'done' ? 'todo' : currentStatus === 'todo' ? 'in-progress' : 'done'

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Task 업데이트 오류:', error)
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'text-green-600 dark:text-green-400'
      case 'in-progress':
        return 'text-blue-600 dark:text-blue-400'
      case 'blocked':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getTypeColor = (type: Task['type']) => {
    switch (type) {
      case 'development':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'testing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'documentation':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'deployment':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getTypeText = (type: Task['type']) => {
    switch (type) {
      case 'development':
        return '개발'
      case 'testing':
        return '테스트'
      case 'documentation':
        return '문서'
      case 'deployment':
        return '배포'
      default:
        return '기타'
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>태스크가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 mt-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
        >
          <div className="flex items-start gap-3 p-4">
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={() => handleTaskToggle(task.id, task.status)}
              className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-sm font-medium ${getStatusColor(task.status)}`}
                >
                  {task.status === 'done'
                    ? '✓'
                    : task.status === 'in-progress'
                      ? '⏳'
                      : '○'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {task.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${getTypeColor(task.type)}`}
                >
                  {getTypeText(task.type)}
                </span>
              </div>
              {task.completion_criteria && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  완료 기준: {task.completion_criteria}
                </p>
              )}
              {task.notes && (
                <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                  메모: {task.notes}
                </p>
              )}
            </div>
            <button
              onClick={() =>
                setExpandedTask(expandedTask === task.id ? null : task.id)
              }
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className={`w-5 h-5 transition-transform ${
                  expandedTask === task.id ? 'rotate-180' : ''
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
            </button>
          </div>

          {expandedTask === task.id && (
            <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600">
              <div className="mt-4">
                <TaskGuide task={task} projectOverview={projectOverview} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
