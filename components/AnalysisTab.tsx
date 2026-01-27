'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AnalysisTabProps {
  projectId: string
  creationMode?: 'new' | 'doc' | 'resume'
  uploadedFilePath?: string
}

type AnalysisStatus = 'pending' | 'analyzing' | 'analyzed' | 'ready'

export default function AnalysisTab({
  projectId,
  creationMode,
  uploadedFilePath,
}: AnalysisTabProps) {
  const [status, setStatus] = useState<AnalysisStatus>('pending')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())
  const [additionalComments, setAdditionalComments] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // 업로드 파일이 있으면 자동으로 분석 시작
    if ((creationMode === 'doc' || creationMode === 'resume') && uploadedFilePath) {
      handleAnalyze()
    }
  }, [creationMode, uploadedFilePath])

  // 페이지를 떠날 때 분석 상태 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (status === 'analyzed' || status === 'analyzing') {
        // 분석 결과 저장 (keepalive 옵션으로 페이지를 떠나도 요청 완료)
        const analysisState = {
          status,
          analysisResult,
          validationResult,
          selectedSuggestions: Array.from(selectedSuggestions),
          additionalComments,
          lastSaved: new Date().toISOString(),
        }

        fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysis_state: JSON.stringify(analysisState),
          }),
          keepalive: true,
        }).catch(() => {})
      }
    }

    const handleVisibilityChange = () => {
      // 탭이 숨겨질 때도 저장
      if (document.hidden && (status === 'analyzed' || status === 'analyzing')) {
        fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysis_state: JSON.stringify({
              status,
              analysisResult,
              validationResult,
              selectedSuggestions: Array.from(selectedSuggestions),
              additionalComments,
              lastSaved: new Date().toISOString(),
            }),
          }),
        }).catch(() => {})
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // 컴포넌트 언마운트 시에도 저장
      if (status === 'analyzed' || status === 'analyzing') {
        fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysis_state: JSON.stringify({
              status,
              analysisResult,
              validationResult,
              selectedSuggestions: Array.from(selectedSuggestions),
              additionalComments,
              lastSaved: new Date().toISOString(),
            }),
          }),
        }).catch(() => {})
      }
    }
  }, [status, analysisResult, validationResult, selectedSuggestions, additionalComments, projectId])

  const handleAnalyze = async () => {
    setStatus('analyzing')
    setError('')

    try {
      if (creationMode === 'doc') {
        // 설계서 분석
        const response = await fetch(`/api/project/analyze-upload?projectId=${projectId}&filePath=${uploadedFilePath}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '분석에 실패했습니다.')
        }

        setAnalysisResult(data.overview)

        // AI 감리 실행
        const validateResponse = await fetch('/api/design/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectOverview: data.overview }),
        })

        if (validateResponse.ok) {
          const validationData = await validateResponse.json()
          setValidationResult(validationData)
        }
      } else if (creationMode === 'resume') {
        // project-state.md 분석
        const fileResponse = await fetch(`/api/storage/download?path=${uploadedFilePath}`)
        const fileContent = await fileResponse.text()

        const analyzeResponse = await fetch('/api/project/analyze-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stateContent: fileContent }),
        })

        if (!analyzeResponse.ok) {
          throw new Error('프로젝트 상태 분석에 실패했습니다.')
        }

        const analysisData = await analyzeResponse.json()
        setAnalysisResult(analysisData)

        // AI 감리 실행
        if (analysisData.projectOverview) {
          const validateResponse = await fetch('/api/design/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectOverview: analysisData.projectOverview }),
          })

          if (validateResponse.ok) {
            const validationData = await validateResponse.json()
            setValidationResult(validationData)
          }
        }
      }

      setStatus('analyzed')
    } catch (err: any) {
      setError(err.message)
      setStatus('pending')
    }
  }

  const handleSuggestionToggle = (index: number) => {
    const newSet = new Set(selectedSuggestions)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setSelectedSuggestions(newSet)
  }

  const handleGeneratePhases = async () => {
    setGenerating(true)
    setError('')

    try {
      // 프로젝트 업데이트
      const updateData: any = {
        description: JSON.stringify(creationMode === 'doc' ? analysisResult : analysisResult?.projectOverview),
      }

      if (validationResult) {
        const appliedSuggestions = validationResult.suggestions?.filter(
          (_: string, index: number) => selectedSuggestions.has(index)
        ) || []

        updateData.validation_result = JSON.stringify({
          ...validationResult,
          appliedSuggestions,
          additionalComments: additionalComments.trim() || null,
        })
      }

      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      // Phase 생성
      await fetch('/api/phases/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })

      // 기존 작업 모드인 경우 Task 생성
      if (creationMode === 'resume' && analysisResult?.nextTasks) {
        const phasesResponse = await fetch(`/api/phases?project_id=${projectId}`)
        const phases = await phasesResponse.json()
        const firstPhase = phases[0]

        if (firstPhase) {
          for (const task of analysisResult.nextTasks) {
            await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phase_id: firstPhase.id,
                name: task,
                type: 'development',
                order: 0,
              }),
            })
          }
        }
      }

      setStatus('ready')

      // 실행 탭으로 전환
      setTimeout(() => {
        router.push(`/project/${projectId}?section=execute`)
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (status === 'pending' && !uploadedFilePath) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-3xl">📄</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            분석할 파일이 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            업로드된 파일이 없습니다.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'analyzing') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">
            업로드된 파일 분석 중...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'ready') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Phase 생성 완료
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            실행 탭으로 이동합니다...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-h-full overflow-y-auto">
      {/* 설계서 모드 결과 */}
      {creationMode === 'doc' && analysisResult && (
        <>
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📄 설계서 분석 완료
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong>목표:</strong> {analysisResult.goal || '-'}</p>
              <p><strong>주 사용자:</strong> {analysisResult.targetUsers || '-'}</p>
              <p><strong>요약:</strong> {analysisResult.summary || '-'}</p>
            </div>
          </div>

          {validationResult && (
            <>
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {validationResult.overallScore || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">종합 점수</div>
                </div>
              </div>

              {validationResult.issues && validationResult.issues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    ⚠️ 발견된 문제
                  </h3>
                  <div className="space-y-2">
                    {validationResult.issues.map((issue: string, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm"
                      >
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    💡 개선 제안
                  </h3>
                  <div className="space-y-2">
                    {validationResult.suggestions.map((suggestion: string, index: number) => (
                      <label
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.has(index)}
                          onChange={() => handleSuggestionToggle(index)}
                          className="w-4 h-4 text-indigo-600 mt-0.5"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          {suggestion}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 기존 작업 모드 결과 */}
      {creationMode === 'resume' && analysisResult && (
        <>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📈 진행 현황
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analysisResult.progress?.completed || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">완료</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analysisResult.progress?.inProgress || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">진행 중</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {analysisResult.progress?.remaining || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">남은 작업</div>
                </div>
              </div>
            </div>
          </div>

          {analysisResult.nextTasks && analysisResult.nextTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                📋 다음 작업
              </h3>
              <div className="space-y-2">
                {analysisResult.nextTasks.map((task: string, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm"
                  >
                    {task}
                  </div>
                ))}
              </div>
            </div>
          )}

          {validationResult && (
            <>
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {validationResult.overallScore || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">감리 점수</div>
                </div>
              </div>

              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    💡 개선 제안
                  </h3>
                  <div className="space-y-2">
                    {validationResult.suggestions.map((suggestion: string, index: number) => (
                      <label
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.has(index)}
                          onChange={() => handleSuggestionToggle(index)}
                          className="w-4 h-4 text-indigo-600 mt-0.5"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          {suggestion}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 최종 의견 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          추가 의견? (선택사항)
        </label>
        <textarea
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition resize-none"
          placeholder="프로젝트에 대한 추가 의견이나 요구사항을 입력하세요"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGeneratePhases}
        disabled={generating || status !== 'analyzed'}
        className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? 'Phase 생성 중...' : 'Phase 생성하기'}
      </button>
    </div>
  )
}
