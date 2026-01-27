/**
 * 설계 플로우 통합 테스트
 * AI 호출은 모두 모킹
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DesignBot from '@/components/DesignBot'
import {
  mockDesignAnalyzeResponse,
  mockTechStackResponse,
  mockRealityCheckResponse,
  mockFinalOverviewResponse,
} from '../mocks/api-responses'

// fetch는 setup.ts에서 모킹됨

describe('DesignBot 통합 테스트', () => {
  const mockProjectId = 'test-project-id'
  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('전체 설계 플로우가 작동합니다', async () => {
    // 1. 작업 시작 모킹
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: 'job-analyze', status: 'pending' }),
    })

    // 2. 분석 완료 모킹
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobId: 'job-analyze',
        status: 'completed',
        result: mockDesignAnalyzeResponse,
      }),
    })

    // 3. 기술 스택 작업 시작
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: 'job-tech', status: 'pending' }),
    })

    // 4. 기술 스택 완료
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobId: 'job-tech',
        status: 'completed',
        result: mockTechStackResponse,
      }),
    })

    // 5. 현실성 체크 작업 시작
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: 'job-reality', status: 'pending' }),
    })

    // 6. 현실성 체크 완료
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobId: 'job-reality',
        status: 'completed',
        result: mockRealityCheckResponse,
      }),
    })

    // 7. 최종 개요 작업 시작
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: 'job-final', status: 'pending' }),
    })

    // 8. 최종 개요 완료
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobId: 'job-final',
        status: 'completed',
        result: mockFinalOverviewResponse,
      }),
    })

    // 9. 상태 저장 모킹
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<DesignBot projectId={mockProjectId} onComplete={mockOnComplete} />)

    // 초기 질문 답변
    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/i)
    const nextButton = screen.getByRole('button', { name: /다음|완료/i })

    fireEvent.change(textarea, { target: { value: '쇼핑몰' } })
    fireEvent.click(nextButton)

    // 분석 완료 대기
    await waitFor(
      () => {
        expect(screen.getByText(/맞춤 질문/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // 기술 스택 옵션 확인
    await waitFor(
      () => {
        expect(screen.getByText(/기술 스택/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })
})
