'use client'

import { useState, useRef, useCallback } from 'react'

interface DesignUploadProps {
  onUploadComplete: (projectId: string) => void
  onCancel: () => void
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
  'text/plain',
]

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.md', '.txt']

export default function DesignUpload({
  onUploadComplete,
  onCancel,
}: DesignUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('지원하지 않는 파일 형식입니다. (PDF, DOCX, MD, TXT만 가능)')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      setError('파일 크기는 10MB 이하여야 합니다.')
      return false
    }
    return true
  }

  const handleFileSelect = (selectedFile: File) => {
    setError('')
    if (validateFile(selectedFile)) {
      setFile(selectedFile)
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      // fetch API 사용 (진행률 추적을 위해 XMLHttpRequest 대신 사용)
      const xhr = new XMLHttpRequest()

      const response = await new Promise<{ ok: boolean; status: number; data: any }>(
        (resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100
              setProgress(percentComplete)
            }
          })

          xhr.addEventListener('load', () => {
            try {
              let data
              if (xhr.responseText) {
                data = JSON.parse(xhr.responseText)
              } else {
                data = {}
              }
              
              resolve({
                ok: xhr.status >= 200 && xhr.status < 300,
                status: xhr.status,
                data,
              })
            } catch (parseError) {
              console.error('[UPLOAD] Parse error:', parseError, 'Response:', xhr.responseText)
              reject(new Error('응답 파싱에 실패했습니다.'))
            }
          })

          xhr.addEventListener('error', () => {
            reject(new Error('업로드 중 오류가 발생했습니다.'))
          })

          xhr.addEventListener('abort', () => {
            reject(new Error('업로드가 취소되었습니다.'))
          })

          xhr.open('POST', '/api/upload/design')
          xhr.send(formData)
        }
      )

      if (!response.ok) {
        const errorMessage = response.data?.error || `서버 오류 (${response.status})`
        console.error('[UPLOAD] Server error:', response.data)
        throw new Error(errorMessage)
      }

      // 업로드 완료 후 프로젝트 ID로 이동
      if (response.data.projectId) {
        console.log('[UPLOAD] Upload successful, project ID:', response.data.projectId)
        onUploadComplete(response.data.projectId)
      } else {
        console.error('[UPLOAD] No project ID in response:', response.data)
        throw new Error('프로젝트 ID를 받지 못했습니다.')
      }
    } catch (err: any) {
      console.error('[UPLOAD] Upload error:', err)
      setError(err.message || '업로드에 실패했습니다.')
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* 파일 드롭존 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.md,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {!file ? (
          <>
            <div className="mb-4">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              파일을 드래그 앤 드롭하거나
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
            >
              파일 선택
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              지원 형식: PDF, DOCX, MD, TXT (최대 10MB)
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <svg
                className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setError('')
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-5 h-5"
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
          </div>
        )}
      </div>

      {/* 업로드 진행률 */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              업로드 및 분석 중...
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? '업로드 중...' : '업로드 및 분석'}
        </button>
      </div>
    </div>
  )
}
