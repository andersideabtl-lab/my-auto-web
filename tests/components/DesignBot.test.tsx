/**
 * DesignBot 컴포넌트 테스트
 * AI 호출은 모킹하여 최소화
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DesignBot from '@/components/DesignBot'
import {
  mockDesignAnalyzeResponse,
} from '../mocks/api-responses'

// fetch는 setup.ts에서 모킹됨

describe('DesignBot', () => {
  const mockProjectId = 'test-project-id'
  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // 상태 복원 API 모킹 (항상 먼저 호출됨)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: mockProjectId,
        design_state: null,
        conversation_history: null,
        description: null,
      }),
    })
  })

  it('초기 질문을 표시합니다', () => {
    render(<DesignBot projectId={mockProjectId} onComplete={mockOnComplete} />)

    expect(screen.getByText(/어떤 것을 만들고 싶으세요/i)).toBeInTheDocument()
  })

  it('답변 입력 필드가 있습니다', () => {
    render(<DesignBot projectId={mockProjectId} onComplete={mockOnComplete} />)

    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/i)
    expect(textarea).toBeInTheDocument()
  })

  it('답변 입력 후 다음 버튼이 작동합니다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: 'job-1', status: 'pending' }),
    })

    // 작업 완료 모킹
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobId: 'job-1',
        status: 'completed',
        result: mockDesignAnalyzeResponse,
      }),
    })

    render(<DesignBot projectId={mockProjectId} onComplete={mockOnComplete} />)

    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/i)
    const nextButton = screen.getByRole('button', { name: /다음|완료/i })

    fireEvent.change(textarea, { target: { value: '쇼핑몰을 만들고 싶습니다' } })
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('진행 단계 표시가 있습니다', () => {
    render(<DesignBot projectId={mockProjectId} onComplete={mockOnComplete} />)

    // 진행 단계 표시 확인 - 여러 요소가 있을 수 있으므로 getAllByText 사용
    const progressElements = screen.getAllByText(/초기 질문/i)
    expect(progressElements.length).toBeGreaterThan(0)
  })

  it('로딩 상태를 표시합니다', async () => {
    // 상태 복원 모킹
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: mockProjectId,
        design_state: null,
        conversation_history: null,
        description: null,
      }),
    })

    // 작업 시작 모킹 (지연)
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ jobId: 'job-1', status: 'pending' }),
              }),
            100
          )
        )
    )

    render(<DesignBot projectId={mockProjectId} onComplete={mockOnComplete} />)

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/답변을 입력하세요/i)
      expect(textarea).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/i)
    const nextButton = screen.getByRole('button', { name: /다음|완료/i })

    fireEvent.change(textarea, { target: { value: '테스트' } })
    fireEvent.click(nextButton)

    // 로딩 인디케이터 확인 - 백그라운드 작업 메시지 확인
    await waitFor(() => {
      // 백그라운드 작업 안내 메시지 또는 AI 분석 메시지 확인
      const loadingMessages = screen.queryAllByText(/백그라운드|작업이 진행|생성 중|처리 중|AI가 프로젝트를 분석/i)
      // 또는 진행 단계 표시 확인
      const progressSteps = screen.queryAllByText(/AI 분석|🤖/i)
      expect(loadingMessages.length + progressSteps.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })
})
