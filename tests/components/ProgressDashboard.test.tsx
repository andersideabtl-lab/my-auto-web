/**
 * ProgressDashboard 컴포넌트 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import ProgressDashboard from '@/components/ProgressDashboard'
import { mockPhasesResponse, mockTasksResponse } from '../mocks/api-responses'

describe('ProgressDashboard', () => {
  const mockProjectId = 'test-project-id'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Phase 목록 API 모킹
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhasesResponse,
    })

    // Task 목록 API 모킹 (각 Phase마다)
    mockPhasesResponse.forEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasksResponse,
      })
    })
  })

  it('진행률 대시보드가 렌더링됩니다', async () => {
    render(<ProgressDashboard projectId={mockProjectId} />)

    await waitFor(() => {
      // "진행률" 텍스트가 여러 곳에 있을 수 있으므로 getAllByText 사용
      const progressElements = screen.getAllByText(/진행률/i)
      expect(progressElements.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })

  it('전체 진행률이 표시됩니다', async () => {
    render(<ProgressDashboard projectId={mockProjectId} />)

    await waitFor(() => {
      expect(screen.getByText(/전체 진행률/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('Phase별 진행률이 표시됩니다', async () => {
    render(<ProgressDashboard projectId={mockProjectId} />)

    await waitFor(() => {
      expect(screen.getByText(/Phase별 진행률/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
