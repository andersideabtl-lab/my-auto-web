'use client'

import { useState } from 'react'
import { SERVICE_PRESETS } from '@/lib/service-presets'
import { ServicePreset } from '@/lib/service-presets'

interface ServiceSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (preset: ServicePreset | 'custom') => void
}

export default function ServiceSelectModal({
  isOpen,
  onClose,
  onSelect,
}: ServiceSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const filteredPresets = SERVICE_PRESETS.filter((preset) =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              서비스 선택
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 검색 */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="서비스 검색..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none"
          />
        </div>

        {/* 서비스 그리드 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onSelect(preset)
                  onClose()
                }}
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-center group"
              >
                <div className="text-4xl mb-2">{preset.icon}</div>
                <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {preset.name}
                </div>
              </button>
            ))}

            {/* 커스텀 옵션 */}
            <button
              onClick={() => {
                onSelect('custom')
                onClose()
              }}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-center group"
            >
              <div className="text-4xl mb-2">➕</div>
              <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                커스텀
              </div>
            </button>
          </div>

          {filteredPresets.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
