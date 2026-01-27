'use client'

import { useState, useMemo } from 'react'
import DocumentViewer from './DocumentViewer'

interface ProjectDocumentsProps {
  projectId: string
  documentFiles: any[]
  initialFileIndex?: number | null
}

type DocumentCategory = 'all' | 'design-doc' | 'report' | 'upload'

const getDocumentCategory = (type: string): DocumentCategory => {
  if (type === 'design' || type === 'design-doc') return 'design-doc'
  if (type === 'report-design' || type === 'report-phase' || type === 'report-audit') return 'report'
  if (type === 'upload') return 'upload'
  return 'all'
}

const getDocumentIcon = (type: string): string => {
  if (type === 'design' || type === 'design-doc') return '📄'
  if (type === 'report-design') return '📊'
  if (type === 'report-phase') return '📈'
  if (type === 'report-audit') return '🔍'
  if (type === 'upload') return '📁'
  return '📄'
}

const getDocumentTypeLabel = (type: string): string => {
  if (type === 'design' || type === 'design-doc') return '설계서'
  if (type === 'report-design') return '설계 리포트'
  if (type === 'report-phase') return 'Phase 리포트'
  if (type === 'report-audit') return '감리 리포트'
  if (type === 'upload') return '업로드 문서'
  return type
}

export default function ProjectDocuments({
  projectId,
  documentFiles,
  initialFileIndex,
}: ProjectDocumentsProps) {
  const [selectedFile, setSelectedFile] = useState<any | null>(
    initialFileIndex !== null && initialFileIndex !== undefined
      ? documentFiles[initialFileIndex] || null
      : null
  )
  const [category, setCategory] = useState<DocumentCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 필터링된 문서 목록
  const filteredDocuments = useMemo(() => {
    let filtered = documentFiles

    // 카테고리 필터
    if (category !== 'all') {
      filtered = filtered.filter((file) => {
        const fileCategory = getDocumentCategory(file.type || '')
        if (category === 'report') {
          return fileCategory === 'report'
        }
        return fileCategory === category
      })
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (file) =>
          file.name?.toLowerCase().includes(query) ||
          getDocumentTypeLabel(file.type || '').toLowerCase().includes(query)
      )
    }

    return filtered
  }, [documentFiles, category, searchQuery])

  if (selectedFile) {
    return (
      <DocumentViewer
        documentFiles={documentFiles}
        onClose={() => setSelectedFile(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              문서
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              생성된 프로젝트 문서 목록
            </p>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="문서 검색..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              category === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setCategory('design-doc')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              category === 'design-doc'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📄 설계서
          </button>
          <button
            onClick={() => setCategory('report')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              category === 'report'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📊 리포트
          </button>
          <button
            onClick={() => setCategory('upload')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              category === 'upload'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📁 업로드 문서
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredDocuments.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                문서가 없습니다
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                설계 완료 후 자동으로 문서가 생성됩니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(file)}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{getDocumentIcon(file.type || '')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {file.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(file.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 rounded">
                      {getDocumentTypeLabel(file.type || '')}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
