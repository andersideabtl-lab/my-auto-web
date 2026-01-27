'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import DesignValidation from './DesignValidation'
import { safeParseJSON, parseStreamingJSON } from '@/lib/json-utils'

interface DesignBotProps {
  projectId: string
  onComplete: (overview: any) => void
}

type Step = 'initial' | 'analyze' | 'customQuestions' | 'techStack' | 'realityCheck' | 'final' | 'validating' | 'validated'

interface Answers {
  [key: string]: string
}

export default function DesignBot({ projectId, onComplete }: DesignBotProps) {
  const [step, setStep] = useState<Step>('initial')
  const [answers, setAnswers] = useState<Answers>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [customQuestions, setCustomQuestions] = useState<string[]>([])
  const [currentCustomQuestion, setCurrentCustomQuestion] = useState(0)
  const [projectType, setProjectType] = useState('')
  const [techStackOptions, setTechStackOptions] = useState<any[]>([])
  const [selectedTechStack, setSelectedTechStack] = useState<any>(null)
  const [realityCheck, setRealityCheck] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [projectOverview, setProjectOverview] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const initialQuestions = [
    { key: 'what', text: '어떤 것을 만들고 싶으세요?' },
    { key: 'why', text: '왜 만들고 싶으세요?' },
    { key: 'when', text: '언제까지 완성하고 싶으세요?' },
  ]

  const [currentInitialQuestion, setCurrentInitialQuestion] = useState(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 상태 저장 함수
  const saveDesignState = useCallback(async () => {
    try {
      const designState = {
        step,
        answers,
        currentInitialQuestion,
        currentCustomQuestion,
        customQuestions,
        projectType,
        techStackOptions,
        selectedTechStack,
        realityCheck,
        isProcessing,
        streamingText,
        projectOverview,
        validationResult,
        lastSaved: new Date().toISOString(),
      }

      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          design_state: JSON.stringify(designState),
        }),
      })
    } catch (error) {
      console.error('상태 저장 오류:', error)
    }
  }, [
    step,
    answers,
    currentInitialQuestion,
    currentCustomQuestion,
    customQuestions,
    projectType,
    techStackOptions,
    selectedTechStack,
    realityCheck,
    isProcessing,
    streamingText,
    projectOverview,
    validationResult,
    projectId,
  ])

  // 디바운스된 상태 저장
  const debouncedSaveState = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveDesignState()
    }, 1000) // 1초 후 저장
  }, [saveDesignState])

  // 페이지를 떠날 때 강제 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 진행 중인 작업이 있으면 저장 (동기적으로)
      if (step !== 'validated' && !isComplete) {
        const designState = {
          step,
          answers,
          currentInitialQuestion,
          currentCustomQuestion,
          customQuestions,
          projectType,
          techStackOptions,
          selectedTechStack,
          realityCheck,
          isProcessing,
          streamingText,
          projectOverview,
          validationResult,
          conversationHistory,
          lastSaved: new Date().toISOString(),
        }

        // navigator.sendBeacon은 POST만 지원하므로 별도 엔드포인트 사용
        const data = JSON.stringify({
          design_state: JSON.stringify(designState),
        })
        
        const blob = new Blob([data], { type: 'application/json' })
        // keepalive 옵션으로 fetch 사용 (페이지를 떠나도 요청 완료)
        fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {})
      }
    }

    const handleVisibilityChange = () => {
      // 탭이 숨겨질 때도 저장
      if (document.hidden && step !== 'validated' && !isComplete) {
        saveDesignState()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // 컴포넌트 언마운트 시에도 저장
      if (step !== 'validated' && !isComplete) {
        saveDesignState()
      }
    }
  }, [step, isComplete, saveDesignState, projectId, answers, currentInitialQuestion, currentCustomQuestion, customQuestions, projectType, techStackOptions, selectedTechStack, realityCheck, isProcessing, streamingText, projectOverview, validationResult, conversationHistory])

  // 초기 상태 복원
  useEffect(() => {
    const restoreState = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response || !response.ok) return

        const project = await response.json()
        if (project.design_state) {
          const savedState = safeParseJSON(project.design_state, false)
          if (savedState && savedState.step) {
            // 완료되지 않은 상태만 복원
            if (savedState.step !== 'validated' && !savedState.isComplete) {
              setStep(savedState.step || 'initial')
              setAnswers(savedState.answers || {})
              setCurrentInitialQuestion(savedState.currentInitialQuestion || 0)
              setCurrentCustomQuestion(savedState.currentCustomQuestion || 0)
              setCustomQuestions(savedState.customQuestions || [])
              setProjectType(savedState.projectType || '')
              setTechStackOptions(savedState.techStackOptions || [])
              setSelectedTechStack(savedState.selectedTechStack || null)
              setRealityCheck(savedState.realityCheck || null)
              setProjectOverview(savedState.projectOverview || null)
              setValidationResult(savedState.validationResult || null)

              // conversation_history 복원
              if (project.conversation_history) {
                const history = safeParseJSON(project.conversation_history, false)
                if (history && Array.isArray(history)) {
                  setConversationHistory(history)
                }
              }

              // 진행 중이었던 경우 경고 표시
              if (savedState.isProcessing) {
                console.warn('이전에 진행 중이던 작업이 중단되었습니다. 다시 시작해주세요.')
              }
            }
          }
        }
      } catch (error) {
        console.error('상태 복원 오류:', error)
      }
    }

    restoreState()
  }, [projectId])

  // 상태 변경 시 자동 저장
  useEffect(() => {
    if (step !== 'initial' || Object.keys(answers).length > 0) {
      debouncedSaveState()
    }
  }, [step, answers, debouncedSaveState])

  // 언마운트 시 최종 상태 저장 및 진행 중인 요청 취소
  useEffect(() => {
    return () => {
      // 진행 중인 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 최종 상태 저장
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveDesignState()
    }
  }, [saveDesignState])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [streamingText, answers])

  const saveConversation = async (type: string, content: string, answer?: string, status: string = 'completed') => {
    const conversationItem = {
      id: Date.now().toString(),
      type,
      content,
      answer: answer || null,
      status,
      timestamp: new Date().toISOString(),
    }

    const newHistory = [...conversationHistory, conversationItem]
    setConversationHistory(newHistory)

    // DB에 저장
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_history: JSON.stringify(newHistory),
        }),
      })
    } catch (error) {
      console.error('대화 저장 오류:', error)
    }
  }

  const handleInitialAnswer = () => {
    if (!currentAnswer.trim()) return

    const question = initialQuestions[currentInitialQuestion]
    const newAnswers = { ...answers, [question.key]: currentAnswer.trim() }
    setAnswers(newAnswers)

    // 대화 저장
    saveConversation('question', question.text, currentAnswer.trim(), 'completed')

    setCurrentAnswer('')

    if (currentInitialQuestion < initialQuestions.length - 1) {
      setCurrentInitialQuestion(currentInitialQuestion + 1)
    } else {
      // 초기 질문 완료 → AI 분석 시작
      analyzeProject(newAnswers)
    }
  }

  // 백그라운드 작업 폴링
  const pollJobStatus = async (jobId: string, step: string) => {
    const maxAttempts = 120 // 최대 2분 (1초 간격)
    let attempts = 0

    const poll = async (): Promise<any> => {
      try {
        const response = await fetch(`/api/design/job/${jobId}`)
        if (!response.ok) {
          throw new Error('작업 상태 확인에 실패했습니다.')
        }

        const data = await response.json()

        if (data.status === 'completed') {
          return data.result
        } else if (data.status === 'failed') {
          throw new Error(data.error || '작업이 실패했습니다.')
        } else if (data.status === 'processing') {
          // 계속 대기
          if (attempts < maxAttempts) {
            attempts++
            await new Promise((resolve) => setTimeout(resolve, 1000)) // 1초 대기
            return poll()
          } else {
            throw new Error('작업 시간이 초과되었습니다.')
          }
        } else {
          // pending 상태
          if (attempts < maxAttempts) {
            attempts++
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return poll()
          } else {
            throw new Error('작업 시간이 초과되었습니다.')
          }
        }
      } catch (error: any) {
        if (error.message.includes('초과')) {
          // 시간 초과 시 DB에서 다시 확인
          const dbResponse = await fetch(`/api/projects/${projectId}`)
          if (dbResponse.ok) {
            const project = await dbResponse.json()
            if (project.design_job_state) {
              const jobState = safeParseJSON(project.design_job_state, false)
              if (jobState && jobState[jobId]) {
                if (jobState[jobId].status === 'completed') {
                  return jobState[jobId].result
                } else if (jobState[jobId].status === 'failed') {
                  throw new Error(jobState[jobId].error || '작업이 실패했습니다.')
                }
              }
            }
          }
        }
        throw error
      }
    }

    return poll()
  }

  const analyzeProject = async (currentAnswers: Answers) => {
    setIsProcessing(true)
    setStep('analyze')
    setStreamingText('AI가 프로젝트를 분석하고 있습니다...')

    try {
      // 백그라운드 작업 시작
      const startResponse = await fetch('/api/design/job/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'analyze',
          answers: currentAnswers,
          projectId,
        }),
      })

      if (!startResponse.ok) {
        throw new Error('작업 시작에 실패했습니다.')
      }

      const { jobId } = await startResponse.json()
      setCurrentJobId(jobId)

      // 작업 상태 폴링
      setStreamingText('백그라운드에서 작업이 진행 중입니다. 페이지를 벗어나도 계속 처리됩니다...')

      const result = await pollJobStatus(jobId, 'analyze')
      setCurrentJobId(null)

      // 결과 처리
      setProjectType(result.projectType)
      setCustomQuestions(result.questions)
      setCurrentCustomQuestion(0)
      setStep('customQuestions')
      setStreamingText('')
    } catch (error: any) {
      setError(error.message || '작업 처리 중 오류가 발생했습니다.')
      setIsProcessing(false)
      setCurrentJobId(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCustomAnswer = () => {
    if (!currentAnswer.trim()) return

    const question = customQuestions[currentCustomQuestion]
    const questionKey = `custom_${currentCustomQuestion}`
    const newAnswers = { ...answers, [questionKey]: currentAnswer.trim() }
    setAnswers(newAnswers)

    // 대화 저장
    saveConversation('question', question, currentAnswer.trim(), 'completed')

    setCurrentAnswer('')

    if (currentCustomQuestion < customQuestions.length - 1) {
      setCurrentCustomQuestion(currentCustomQuestion + 1)
    } else {
      // 맞춤 질문 완료 → 기술 스택 제안
      suggestTechStack(newAnswers)
    }
  }

  const suggestTechStack = async (currentAnswers: Answers) => {
    setIsProcessing(true)
    setStep('techStack')
    setStreamingText('')

    // 진행 중인 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'techStack',
          answers: currentAnswers,
          projectType,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error('기술 스택 제안에 실패했습니다.')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = parseStreamingJSON(line)
              if (data && data.text) {
                fullText += data.text
                setStreamingText(fullText)
              }
            }
          }
        }
      }

      const techStackData = safeParseJSON(fullText)
      setTechStackOptions(techStackData.options)
      setStreamingText('')
    } catch (error: any) {
      setError(error.message || '기술 스택 생성 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTechStackSelect = (option: any) => {
    setSelectedTechStack(option)
    // 약간의 딜레이 후 현실성 체크 시작 (선택 피드백을 위해)
    setTimeout(() => {
      checkReality()
    }, 300)
  }

  const checkReality = async () => {
    setIsProcessing(true)
    setStep('realityCheck')
    setStreamingText('현실성 체크를 진행하고 있습니다...')

    try {
      const allAnswers = {
        ...answers,
        techStack: selectedTechStack?.name || '',
      }

      // 백그라운드 작업 시작
      const startResponse = await fetch('/api/design/job/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'realityCheck',
          answers: allAnswers,
          projectType,
          projectId,
        }),
      })

      if (!startResponse.ok) {
        throw new Error('작업 시작에 실패했습니다.')
      }

      const { jobId } = await startResponse.json()
      setCurrentJobId(jobId)

      // 작업 상태 폴링
      setStreamingText('백그라운드에서 작업이 진행 중입니다. 페이지를 벗어나도 계속 처리됩니다...')

      const realityData = await pollJobStatus(jobId, 'realityCheck')
      setCurrentJobId(null)

      setRealityCheck(realityData)
      setStreamingText('')

      // 최종 개요 생성
      generateFinalOverview(allAnswers, realityData)
    } catch (error: any) {
      setError(error.message || '작업 처리 중 오류가 발생했습니다.')
      setCurrentJobId(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateFinalOverview = async (allAnswers: Answers, realityData: any) => {
    setIsProcessing(true)
    setStep('final')

    // 진행 중인 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'final',
          answers: { ...allAnswers, realityCheck: realityData },
          projectType,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error('최종 개요 생성에 실패했습니다.')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                fullText += data.text
              }
            }
          }
        }
      }

      const overview = safeParseJSON(fullText)
      setProjectOverview(overview)

      // 검증 시작
      setStep('validating')
      validateDesign(overview)
    } catch (error: any) {
      // AbortError는 무시 (페이지 이탈 등)
      if (error.name === 'AbortError') {
        console.log('요청이 취소되었습니다.')
        return
      }
      setError(error.message || '개요 생성 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const validateDesign = async (overview: any) => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/design/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectOverview: overview }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '검증에 실패했습니다.')
      }

      const result = await response.json()
      setValidationResult(result)
      setStep('validated')
    } catch (error: any) {
      setError(`검증 오류: ${error.message}`)
      // 검증 실패해도 진행 가능하도록
      setStep('validated')
      setValidationResult({
        overallScore: 0,
        issues: ['검증 중 오류가 발생했습니다.'],
        strengths: [],
        suggestions: [],
        benchmarking: { competitors: [] },
        uiux: { bestPractices: [], strengths: [], improvements: [] },
        feasibility: { features: [], warnings: [] },
        techStack: { currentStack: { pros: [], cons: [] }, alternatives: [] },
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleModify = () => {
    // 설계 처음부터 다시 시작
    setStep('initial')
    setAnswers({})
    setCurrentAnswer('')
    setCustomQuestions([])
    setCurrentCustomQuestion(0)
    setProjectType('')
    setTechStackOptions([])
    setSelectedTechStack(null)
    setRealityCheck(null)
    setProjectOverview(null)
    setValidationResult(null)
    setCurrentInitialQuestion(0)
  }

  const handleProceed = async () => {
    // final_decisions 추출
    let finalDecisions = {
      completed: [],
      pending: [],
      deferred: [],
    }

    try {
      const decisionsResponse = await fetch('/api/design/extract-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationHistory }),
      })

      if (decisionsResponse.ok) {
        const decisionsData = await decisionsResponse.json()
        finalDecisions = decisionsData.finalDecisions || finalDecisions
      }
    } catch (error) {
      console.error('최종 결정사항 추출 오류:', error)
    }

    // 프로젝트 저장
    try {
      const saveResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: JSON.stringify(projectOverview),
          validation_result: JSON.stringify(validationResult),
          final_decisions: JSON.stringify(finalDecisions),
        }),
      })

      if (!saveResponse.ok) {
        throw new Error('프로젝트 저장에 실패했습니다.')
      }

      // Phase 자동 생성
      try {
        const phaseResponse = await fetch('/api/phases/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: projectId }),
        })

        if (phaseResponse.ok) {
          console.log('Phase 생성 완료')
        }
      } catch (phaseError) {
        console.error('Phase 생성 오류:', phaseError)
        // Phase 생성 실패해도 진행
      }

      // 설계서 PDF 자동 생성
      try {
        const pdfResponse = await fetch('/api/documents/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        })

        if (pdfResponse.ok) {
          console.log('설계서 PDF 생성 완료')
        }
      } catch (pdfError) {
        console.error('설계서 PDF 생성 오류:', pdfError)
        // PDF 생성 실패해도 진행
      }

      // 설계 리포트 자동 생성 (validationResult가 있을 때만)
      if (validationResult) {
        try {
          const reportResponse = await fetch('/api/reports/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              reportType: 'design',
            }),
          })

          if (reportResponse.ok) {
            console.log('설계 리포트 생성 완료')
          }
        } catch (reportError) {
          console.error('설계 리포트 생성 오류:', reportError)
          // 리포트 생성 실패해도 진행
        }
      }

      setIsComplete(true)
      onComplete(projectOverview)
      
      // 프로젝트 페이지로 리다이렉트 (설계 탭)
      // 리다이렉트는 부모 컴포넌트에서 처리
    } catch (error: any) {
      setError(error.message || '검증 처리 중 오류가 발생했습니다.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (step === 'initial') {
        handleInitialAnswer()
      } else if (step === 'customQuestions') {
        handleCustomAnswer()
      }
    }
  }

  // 진행 중 경고 표시 (백그라운드 작업이 아닐 때만)
  // 백그라운드 작업(jobId가 있는 경우)은 서버에서 처리되므로 경고 불필요
  const showProcessingWarning = isProcessing && !currentJobId && (
    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            작업이 진행 중입니다
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
            이 페이지를 벗어나면 진행 중인 작업이 중단될 수 있습니다. 
            진행 상태는 자동으로 저장되며, 나중에 복원할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )

  // 검증 완료 후 검증 결과 표시
  if (step === 'validated' && validationResult) {
    return (
      <DesignValidation
        validationResult={validationResult}
        onModify={handleModify}
        onProceed={handleProceed}
      />
    )
  }

  if (isComplete) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            설계가 완료되었습니다! 🎉
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            프로젝트 개요가 생성되어 저장되었습니다.
          </p>
        </div>
      </div>
    )
  }

  // 진행 단계 표시
  const getStepProgress = () => {
    const steps = [
      { key: 'initial', label: '초기 질문', icon: '1️⃣' },
      { key: 'analyze', label: 'AI 분석', icon: '🤖' },
      { key: 'customQuestions', label: '맞춤 질문', icon: '❓' },
      { key: 'techStack', label: '기술 스택', icon: '💻' },
      { key: 'realityCheck', label: '현실성 체크', icon: '⚠️' },
      { key: 'final', label: '개요 생성', icon: '📋' },
      { key: 'validating', label: '검증', icon: '🔍' },
    ]
    
    const currentStepIndex = steps.findIndex(s => s.key === step)
    return { steps, currentStepIndex }
  }

  const { steps, currentStepIndex } = getStepProgress()

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* 오류 메시지 */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  오류: {error}
                </p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
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

      {/* 진행 중 경고 */}
      {showProcessingWarning}
      
      {/* 진행 단계 표시 */}
      {currentStepIndex >= 0 && (
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 overflow-x-auto">
            {steps.slice(0, currentStepIndex + 2).map((s, idx) => {
              const isActive = s.key === step
              const isCompleted = idx < currentStepIndex
              
              return (
                <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition ${
                      isActive
                        ? 'bg-indigo-600 text-white font-medium'
                        : isCompleted
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {idx < steps.slice(0, currentStepIndex + 2).length - 1 && (
                    <div
                      className={`w-8 h-0.5 ${
                        isCompleted
                          ? 'bg-gray-300 dark:bg-gray-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* 백그라운드 작업 안내 */}
        {isProcessing && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  백그라운드 작업 진행 중
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  작업이 서버에서 진행되고 있습니다. 이 페이지를 벗어나도 작업은 계속 진행되며, 
                  완료되면 자동으로 결과가 저장됩니다. 잠시 후 다시 확인해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 초기 질문 */}
        {step === 'initial' && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {currentInitialQuestion + 1}
              </span>
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none p-4">
                <p className="text-gray-900 dark:text-white font-medium">
                  {initialQuestions[currentInitialQuestion].text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 이전 답변들 */}
        {Object.entries(answers).map(([key, value], idx) => {
          const question = initialQuestions.find((q) => q.key === key) || {
            text: customQuestions[parseInt(key.split('_')[1])] || '질문',
          }
          return (
            <div key={key} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ✓
                </span>
              </div>
              <div className="flex-1">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl rounded-tr-none p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {question.text}
                  </p>
                  <p className="text-gray-900 dark:text-white">{value}</p>
                </div>
              </div>
            </div>
          )
        })}

        {/* AI 분석 중 */}
        {step === 'analyze' && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white">🤖</span>
            </div>
            <div className="flex-1">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl rounded-tl-none p-4">
                <p className="text-gray-900 dark:text-white font-medium mb-2">
                  프로젝트 유형을 분석하고 맞춤 질문을 생성하는 중...
                </p>
                {streamingText && (
                  <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {streamingText}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 맞춤 질문 */}
        {step === 'customQuestions' && !isProcessing && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {currentCustomQuestion + 1}
              </span>
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  [{projectType}] 맞춤 질문
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {customQuestions[currentCustomQuestion]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 기술 스택 옵션 로딩 중 */}
        {step === 'techStack' && isProcessing && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white">💻</span>
            </div>
            <div className="flex-1">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl rounded-tl-none p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    추천 기술 스택 옵션 생성 중...
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  프로젝트에 최적화된 기술 스택 옵션을 분석하고 있습니다.
                </p>
                {streamingText && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {streamingText}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 기술 스택 옵션 */}
        {step === 'techStack' && !isProcessing && techStackOptions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white">💻</span>
              </div>
              <div className="flex-1">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl rounded-tl-none p-4">
                  <p className="text-gray-900 dark:text-white font-medium mb-2">
                    추천 기술 스택 옵션
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    아래 옵션 중 하나를 선택해주세요. 선택하면 자동으로 다음 단계로 진행됩니다.
                  </p>
                  <div className="space-y-3">
                    {techStackOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTechStackSelect(option)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedTechStack?.name === option.name
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-800'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {option.name}
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <p>Frontend: {option.stack.frontend}</p>
                              <p>Backend: {option.stack.backend}</p>
                              <p>Database: {option.stack.database}</p>
                            </div>
                            {option.reason && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                                {option.reason}
                              </p>
                            )}
                          </div>
                          {selectedTechStack?.name === option.name && (
                            <div className="ml-3 flex-shrink-0">
                              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedTechStack && (
                    <div className="mt-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg border border-indigo-300 dark:border-indigo-700">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <p className="text-sm text-indigo-800 dark:text-indigo-300">
                          현실성 체크를 진행하고 있습니다...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 현실성 체크 로딩 중 */}
        {step === 'realityCheck' && isProcessing && !realityCheck && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-white">⚠️</span>
            </div>
            <div className="flex-1">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl rounded-tl-none p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    현실성 체크 중...
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  기한, 기능 범위, 위험 요소를 분석하고 Phase 구조를 제안하고 있습니다.
                </p>
                {streamingText && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {streamingText}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 현실성 체크 결과 */}
        {step === 'realityCheck' && realityCheck && !isProcessing && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white">⚠️</span>
              </div>
              <div className="flex-1">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl rounded-tl-none p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    현실성 체크 결과
                  </h4>
                  {realityCheck.warnings && realityCheck.warnings.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2">
                        경고:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {realityCheck.warnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {realityCheck.phases && (
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                        제안된 Phase 구조:
                      </p>
                      <div className="space-y-2">
                        {realityCheck.phases.map((phase: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 bg-white dark:bg-gray-800 rounded-lg"
                          >
                            <p className="font-medium text-gray-900 dark:text-white">
                              {phase.name} ({phase.duration})
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {phase.features?.join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 검증 중 */}
        {step === 'validating' && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  🔍 설계 검증 중...
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                벤치마킹, UI/UX, 실현가능성, 기술 스택을 분석하고 있습니다.
                <br />
                약 30초 정도 소요됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 최종 개요 생성 중 */}
        {step === 'final' && isProcessing && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white">📋</span>
            </div>
            <div className="flex-1">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl rounded-tl-none p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    프로젝트 개요 생성 중...
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  모든 정보를 종합하여 최종 프로젝트 개요를 생성하고 있습니다.
                  <br />
                  완료되면 자동으로 설계 검증이 시작됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 일반 처리 중 (기타 단계) */}
        {isProcessing && 
         step !== 'analyze' && 
         step !== 'techStack' && 
         step !== 'realityCheck' && 
         step !== 'final' && 
         step !== 'validating' && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span>처리 중...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      {(step === 'initial' || step === 'customQuestions') && !isProcessing && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="답변을 입력하세요..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white outline-none resize-none"
              rows={3}
              autoFocus
            />
            <button
              onClick={
                step === 'initial' ? handleInitialAnswer : handleCustomAnswer
              }
              disabled={!currentAnswer.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 'initial' &&
              currentInitialQuestion < initialQuestions.length - 1
                ? '다음'
                : step === 'customQuestions' &&
                  currentCustomQuestion < customQuestions.length - 1
                  ? '다음'
                  : '완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
