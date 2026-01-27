'use client'

import { useState } from 'react'

interface AuditRunnerProps {
  projectId: string
}

export default function AuditRunner({ projectId }: AuditRunnerProps) {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runAudit = async () => {
    setRunning(true)
    setResults(null)

    try {
      const response = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '감리 실행에 실패했습니다.')
      }

      setResults(data)

      // 감리 리포트 자동 생성 (백그라운드)
      try {
        // 프로젝트에 감리 결과 저장
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            validation_result: JSON.stringify({
              audit: data,
              overallScore: data.score,
              timestamp: new Date().toISOString(),
            }),
          }),
        })

        // 감리 리포트 생성
        await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            reportType: 'audit',
          }),
        })
      } catch (reportError) {
        console.error('감리 리포트 생성 오류:', reportError)
        // 리포트 생성 실패해도 감리 결과는 표시
      }
    } catch (error: any) {
      alert(`오류: ${error.message}`)
    } finally {
      setRunning(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            코드 품질 검사
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ESLint와 TypeScript를 실행하여 코드를 검사합니다
          </p>
        </div>
        <button
          onClick={runAudit}
          disabled={running}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? '실행 중...' : '감리 실행'}
        </button>
      </div>

      {running && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              코드를 검사하는 중...
            </p>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* 종합 점수 */}
          <div
            className={`p-6 rounded-xl ${getScoreBgColor(results.score)}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  종합 점수
                </p>
                <p
                  className={`text-4xl font-bold ${getScoreColor(
                    results.score
                  )}`}
                >
                  {results.score}/100
                </p>
              </div>
            </div>
          </div>

          {/* ESLint 결과 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                ESLint
              </h4>
              <span
                className={`px-3 py-1 rounded text-sm ${
                  results.eslint.success
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {results.eslint.success ? '통과' : '실패'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-400">
                  오류: <strong>{results.eslint.errors}</strong>
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  경고: <strong>{results.eslint.warnings}</strong>
                </span>
              </div>
              {results.eslint.output && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                    상세 출력 보기
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                    {results.eslint.output}
                  </pre>
                </details>
              )}
            </div>
          </div>

          {/* TypeScript 결과 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                TypeScript
              </h4>
              <span
                className={`px-3 py-1 rounded text-sm ${
                  results.typescript.success
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {results.typescript.success ? '통과' : '실패'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  오류: <strong>{results.typescript.errors}</strong>
                </span>
              </div>
              {results.typescript.output && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                    상세 출력 보기
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                    {results.typescript.output}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {!results && !running && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-3xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            감리를 시작하세요
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            '감리 실행' 버튼을 클릭하여 코드 품질을 검사하세요
          </p>
        </div>
      )}
    </div>
  )
}
