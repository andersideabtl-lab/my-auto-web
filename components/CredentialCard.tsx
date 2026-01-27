'use client'

import { Credential } from '@/types/credential'
import { getPresetById } from '@/lib/service-presets'
import { useState } from 'react'

interface CredentialCardProps {
  credential: Credential
  onDelete: (id: string) => void
  onVerify: (id: string) => void
  onEdit: (credential: Credential) => void
}

export default function CredentialCard({
  credential,
  onDelete,
  onVerify,
  onEdit,
}: CredentialCardProps) {
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      await onVerify(credential.id)
    } finally {
      setIsVerifying(false)
    }
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return '검증 안 됨'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  const preset = credential.service_name
    ? getPresetById(credential.service_name)
    : null
  const serviceName = credential.display_name || preset?.name || credential.service
  const serviceLink = credential.management_url || preset?.managementUrl || ''
  const serviceIcon = preset?.icon || '🔑'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{serviceIcon}</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {serviceName}
            </h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <code className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {credential.api_key}
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* 상태 */}
        <div className="flex items-center gap-2">
          {credential.is_shared && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
              팀 공유
            </span>
          )}
          {credential.is_valid ? (
            <>
              <span className="text-green-600 dark:text-green-400">✅</span>
              <span className="text-sm text-green-700 dark:text-green-400">
                유효
              </span>
              {credential.last_verified && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({formatTimeAgo(credential.last_verified)})
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-red-600 dark:text-red-400">❌</span>
              <span className="text-sm text-red-700 dark:text-red-400">
                유효하지 않음
              </span>
            </>
          )}
        </div>

        {/* 수정일 */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          수정: {new Date(credential.updated_at).toLocaleDateString('ko-KR')}
        </div>

        {/* 관리 링크 */}
        {serviceLink && (
          <a
            href={serviceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
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
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>
              {serviceLink.startsWith('http')
                ? new URL(serviceLink).hostname
                : serviceLink}
            </span>
          </a>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          {isVerifying ? '검증 중...' : '테스트'}
        </button>
        <button
          onClick={() => onEdit(credential)}
          className="px-3 py-2 text-sm border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(credential.id)}
          className="px-3 py-2 text-sm border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          삭제
        </button>
      </div>
    </div>
  )
}
