'use client'

import { useState } from 'react'

interface ValidationResult {
  overallScore: number
  benchmarking: {
    competitors: Array<{
      name: string
      similarity: string
      strengths: string[]
      weaknesses: string[]
      differentiation: string
    }>
    marketPosition: string
    risks: string[]
    opportunities: string[]
  }
  uiux: {
    bestPractices: Array<{
      category: string
      current: string
      recommendation: string
      priority: string
    }>
    strengths: string[]
    improvements: Array<{
      issue: string
      suggestion: string
      impact: string
    }>
    score: number
  }
  feasibility: {
    features: Array<{
      name: string
      estimatedTime: string
      complexity: string
      dependencies: string[]
      risks: string[]
    }>
    totalEstimate: string
    criticalPath: string[]
    bottlenecks: string[]
    realistic: boolean
    warnings: string[]
  }
  techStack: {
    currentStack: {
      pros: string[]
      cons: string[]
      suitability: string
    }
    alternatives: Array<{
      name: string
      pros: string[]
      cons: string[]
      whenToUse: string
    }>
    recommendations: string[]
    concerns: string[]
  }
  issues: string[]
  strengths: string[]
  suggestions: string[]
  timestamp: string
}

interface DesignValidationProps {
  validationResult: ValidationResult
  onModify: () => void
  onProceed: () => void
}

export default function DesignValidation({
  validationResult,
  onModify,
  onProceed,
}: DesignValidationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['issues', 'strengths', 'suggestions', 'benchmarking'])
  )

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                설계 완료!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🔍 자동 검증 완료
              </p>
            </div>
          </div>

          {/* 종합 점수 */}
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg ${getScoreBgColor(
              validationResult.overallScore
            )}`}
          >
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                종합 점수
              </p>
              <p
                className={`text-3xl font-bold ${getScoreColor(
                  validationResult.overallScore
                )}`}
              >
                {validationResult.overallScore}/100
              </p>
            </div>
          </div>
        </div>

        {/* 발견된 문제 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm">
          <button
            onClick={() => toggleSection('issues')}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  발견된 문제
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {validationResult.issues.length}개
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.has('issues') ? 'rotate-180' : ''
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
          {expandedSections.has('issues') && (
            <div className="px-4 pb-4 space-y-2">
              {validationResult.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30"
                >
                  <p className="text-sm text-red-800 dark:text-red-400">
                    {issue}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 잘된 점 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-900/50 shadow-sm">
          <button
            onClick={() => toggleSection('strengths')}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  잘된 점
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {validationResult.strengths.length}개
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.has('strengths') ? 'rotate-180' : ''
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
          {expandedSections.has('strengths') && (
            <div className="px-4 pb-4 space-y-2">
              {validationResult.strengths.map((strength, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-900/30"
                >
                  <p className="text-sm text-green-800 dark:text-green-400">
                    {strength}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 개선 제안 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-900/50 shadow-sm">
          <button
            onClick={() => toggleSection('suggestions')}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  개선 제안
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {validationResult.suggestions.length}개
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.has('suggestions') ? 'rotate-180' : ''
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
          {expandedSections.has('suggestions') && (
            <div className="px-4 pb-4 space-y-2">
              {validationResult.suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-900/30"
                >
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    {suggestion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 벤치마킹 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <button
            onClick={() => toggleSection('benchmarking')}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  벤치마킹
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  경쟁 제품 비교
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.has('benchmarking') ? 'rotate-180' : ''
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
          {expandedSections.has('benchmarking') && (
            <div className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        제품명
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        유사도
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        강점
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        차별화 포인트
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.benchmarking.competitors.map(
                      (competitor, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                            {competitor.name}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                competitor.similarity === '높음'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : competitor.similarity === '중간'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              }`}
                            >
                              {competitor.similarity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {competitor.strengths.join(', ')}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {competitor.differentiation}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              {validationResult.benchmarking.marketPosition && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    시장 포지셔닝:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {validationResult.benchmarking.marketPosition}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-4">
          <button
            onClick={onModify}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            설계 수정하기
          </button>
          <button
            onClick={onProceed}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
          >
            이대로 진행하기
          </button>
        </div>
      </div>
    </div>
  )
}
