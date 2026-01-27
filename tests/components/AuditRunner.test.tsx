/**
 * AuditRunner 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuditRunner from '@/components/AuditRunner'

describe('AuditRunner', () => {
  const mockProjectId = 'test-project-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('감리 실행 버튼이 있습니다', () => {
    render(<AuditRunner projectId={mockProjectId} />)

    // "감리 실행" 버튼 찾기 (여러 곳에 있을 수 있으므로 role로 찾기)
    const runButton = screen.getByRole('button', { name: /감리 실행/i })
    expect(runButton).toBeInTheDocument()
  })

  it('감리 실행 버튼 클릭 시 API를 호출합니다', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        score: 85,
        eslint: { output: 'No errors', errors: 0, warnings: 0 },
        typescript: { output: 'No errors', errors: 0 },
      }),
    })

    render(<AuditRunner projectId={mockProjectId} />)

    const runButton = screen.getByRole('button', { name: /감리 실행/i })
    fireEvent.click(runButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: mockProjectId }),
      })
    })
  })

  it('감리 결과가 표시됩니다', async () => {
    const mockResult = {
      score: 85,
      eslint: { output: 'No errors', errors: 0, warnings: 0 },
      typescript: { output: 'No errors', errors: 0 },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    })

    render(<AuditRunner projectId={mockProjectId} />)

    const runButton = screen.getByRole('button', { name: /감리 실행/i })
    fireEvent.click(runButton)

    await waitFor(() => {
      // "85" 또는 "종합 점수" 텍스트 확인 (여러 곳에 있을 수 있으므로 getAllByText 사용)
      const scoreElements = screen.getAllByText(/85|종합 점수/i)
      expect(scoreElements.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })
})
