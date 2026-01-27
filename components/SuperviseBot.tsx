'use client'

import { useState } from 'react'
import AuditRunner from './AuditRunner'

interface SuperviseBotProps {
  projectId: string
  projectOverview: any
}

export default function SuperviseBot({
  projectId,
  projectOverview,
}: SuperviseBotProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          코드 감리
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          ESLint와 TypeScript를 실행하여 코드 품질을 검사합니다
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AuditRunner projectId={projectId} />
      </div>
    </div>
  )
}
