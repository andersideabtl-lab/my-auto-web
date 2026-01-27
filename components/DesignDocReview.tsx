'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface DesignDocReviewProps {
  onComplete: (projectId: string) => void
  onCancel: () => void
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.md', '.txt']

export default function DesignDocReview({
  onComplete,
  onCancel,
}: DesignDocReviewProps) {
  const [file, setFile] = useState<File | null>(null)
  const [projectName, setProjectName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('지원하지 않는 파일 형식입니다. (PDF, DOCX, MD, TXT만 가능)')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      return false
    }
    return true
  }

  const handleFileSelect = (selectedFile: File) => {
    setError('')
    if (validateFile(selectedFile)) {
      setFile(selectedFile)
      // 파일명에서 확장자 제거하여 프로젝트명 자동 입력
      if (!projectName) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '')
        setProjectName(nameWithoutExt)
      }
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    []
  )

  const handleCreate = async () => {
    if (!file || !projectName.trim()) {
      setError('파일과 프로젝트명을 입력해주세요.')
      return
    }

    setCreating(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectName', projectName.trim())

      // 파일 업로드 및 프로젝트 생성
      const response = await fetch('/api/upload/design', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '프로젝트 생성에 실패했습니다.')
      }

      const projectId = data.id

      if (!projectId) {
        throw new Error('프로젝트 ID를 받지 못했습니다.')
      }

      console.log('[DesignDocReview] Project created:', projectId)

      onComplete(projectId)

      // 프로젝트 생성 성공 - 해당 프로젝트 분석 탭으로 이동
      router.push(`/project/${projectId}?section=analysis`)
    } catch (err: any) {
      setError(err.message)
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 파일 업로드 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.md,.txt"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) handleFileSelect(selectedFile)
          }}
          className="hidden"
        />
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          <div>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
              설계서 파일을 드래그하거나 클릭하여 선택
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PDF, DOCX, MD, TXT 파일 지원 (최대 10MB)
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            파일 선택
          </button>
          {file && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-white">
                선택된 파일: {file.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 프로젝트명 입력 */}
      <div>
        <label
          htmlFor="projectName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          프로젝트 이름 *
        </label>
        <input
          id="projectName"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition"
          placeholder="프로젝트 이름을 입력하세요"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          파일명에서 자동으로 추출됩니다
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={creating}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!file || !projectName.trim() || creating}
          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? '프로젝트 생성 중...' : '프로젝트 생성'}
        </button>
      </div>
    </div>
  )
}
