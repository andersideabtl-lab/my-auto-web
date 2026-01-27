'use client'

import { useState } from 'react'
import CreateProjectModal from './CreateProjectModal'

interface EmptyProjectsStateProps {
  onCreateProject: () => void
}

export default function EmptyProjectsState({
  onCreateProject,
}: EmptyProjectsStateProps) {
  const [isDesignBotOpen, setIsDesignBotOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isResumeOpen, setIsResumeOpen] = useState(false)

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-16 text-center border border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto">
          {/* 중앙 아이콘 */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            프로젝트를 시작해 보세요
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            AI 설계봇과 함께 새로운 프로젝트를 만들어보세요.
            <br />
            설계부터 실행까지 모든 과정을 도와드립니다.
          </p>

          {/* 메인 버튼 */}
          <div className="mb-6">
            <button
              onClick={() => {
                setIsDesignBotOpen(true)
              }}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto"
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              신규 프로젝트 시작
            </button>
          </div>

          {/* 보조 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <button
              onClick={() => {
                setIsUploadOpen(true)
              }}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-lg transition flex items-center justify-center gap-2"
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              설계서 업로드
            </button>
            <button
              onClick={() => {
                setIsResumeOpen(true)
              }}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-lg transition flex items-center justify-center gap-2"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              기존 작업 이어가기
            </button>
          </div>

          {/* 시작 가이드 */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              시작하기 전에
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-1">
                  1. 프로젝트 생성
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  설계봇 또는 설계서 업로드로 시작
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-1">
                  2. AI 설계
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  AI가 맞춤형 설계 제안
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-1">
                  3. 실행 및 감리
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Phase별 진행 및 코드 검사
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <CreateProjectModal
        isOpen={isDesignBotOpen}
        onClose={() => setIsDesignBotOpen(false)}
        onSuccess={() => {
          setIsDesignBotOpen(false)
          // 프로젝트 생성 후 자동으로 프로젝트 페이지로 이동하므로 reload 불필요
        }}
        defaultMode="designbot"
      />
      <CreateProjectModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          setIsUploadOpen(false)
          // 프로젝트 생성 후 자동으로 프로젝트 페이지로 이동하므로 reload 불필요
        }}
        defaultMode="upload"
      />
      <CreateProjectModal
        isOpen={isResumeOpen}
        onClose={() => setIsResumeOpen(false)}
        onSuccess={() => {
          setIsResumeOpen(false)
          // 프로젝트 생성 후 자동으로 프로젝트 페이지로 이동하므로 reload 불필요
        }}
        defaultMode="resume"
      />
    </>
  )
}
