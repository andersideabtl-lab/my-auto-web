'use client'

import { useState } from 'react'
import { CreateProjectInput } from '@/types/project'
import DesignDocReview from './DesignDocReview'
import ProjectResume from './ProjectResume'
import { useRouter } from 'next/navigation'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultMode?: 'designbot' | 'upload' | 'resume'
}

type CreationMode = 'bot' | 'upload' | 'resume'

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'designbot',
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<CreationMode>(
    defaultMode === 'upload' ? 'upload' : defaultMode === 'resume' ? 'resume' : 'bot'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 업로드 모드일 때는 form submit 방지
    if (mode === 'upload') {
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '프로젝트 생성에 실패했습니다.')
      }

      setName('')
      setDescription('')
      setMode('bot')
      onSuccess()
      onClose()

      // 프로젝트 생성 성공 - 해당 프로젝트 페이지로 이동
      if (data.id) {
        router.push(`/project/${data.id}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                프로젝트 생성
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                프로젝트 생성 방식을 선택하세요
              </p>
            </div>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 생성 방식 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                생성 방식
              </label>
              <div className="space-y-2">
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    mode === 'bot'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="bot"
                    checked={mode === 'bot'}
                    onChange={(e) => setMode(e.target.value as CreationMode)}
                    className="w-4 h-4 text-indigo-600 mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      ○ 신규 프로젝트 (설계봇)
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      AI와 대화하며 프로젝트를 설계합니다
                    </div>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    mode === 'upload'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="upload"
                    checked={mode === 'upload'}
                    onChange={(e) => setMode(e.target.value as CreationMode)}
                    className="w-4 h-4 text-indigo-600 mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      ○ 설계서 업로드
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      설계서 파일을 업로드하고 AI 감리를 받습니다
                    </div>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    mode === 'resume'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="resume"
                    checked={mode === 'resume'}
                    onChange={(e) => setMode(e.target.value as CreationMode)}
                    className="w-4 h-4 text-indigo-600 mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      ○ 기존 작업 이어가기
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      project-state.md를 업로드하여 진행 상황을 분석하고 이어갑니다
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {mode === 'upload' ? (
              <DesignDocReview
                onComplete={(projectId) => {
                  onSuccess()
                  onClose()
                  // DesignDocReview에서 이미 리다이렉트하므로 여기서는 하지 않음
                }}
                onCancel={onClose}
              />
            ) : mode === 'resume' ? (
              <ProjectResume
                onComplete={(projectId) => {
                  onSuccess()
                  onClose()
                  // ProjectResume에서 이미 리다이렉트하므로 여기서는 하지 않음
                }}
                onCancel={onClose}
              />
            ) : (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    프로젝트 이름 *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition"
                    placeholder="프로젝트 이름을 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    설명 (선택사항)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition resize-none"
                    placeholder="프로젝트에 대한 설명을 입력하세요"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '프로젝트 생성 중...' : '프로젝트 생성'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
