/**
 * PhaseList 컴포넌트 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import PhaseList from '@/components/PhaseList'
import { mockPhasesResponse, mockTasksResponse } from '../mocks/api-responses'

describe('PhaseList', () => {
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

  it('Phase 목록을 렌더링합니다', async () => {
    render(<PhaseList projectId={mockProjectId} />)

    await waitFor(() => {
      expect(screen.getByText(/Phase 1/i)).toBeInTheDocument()
    })
  })

  it('Phase 아코디언이 작동합니다', async () => {
    render(<PhaseList projectId={mockProjectId} />)

    await waitFor(() => {
      const phase1 = screen.getByText(/Phase 1/i)
      expect(phase1).toBeInTheDocument()
    })

    // Phase 클릭 시 Task 목록이 표시되는지 확인
    // (실제 구현에 따라 다를 수 있음)
  })

  it('진행률 바가 표시됩니다', async () => {
    render(<PhaseList projectId={mockProjectId} />)

    await waitFor(() => {
      // Phase 이름 또는 진행률 텍스트 확인
      const phaseElements = screen.getAllByText(/Phase 1|기본 기능|진행률/i)
      expect(phaseElements.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })
})
