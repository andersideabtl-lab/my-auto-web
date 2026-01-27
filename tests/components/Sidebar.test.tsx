/**
 * Sidebar 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'

describe('Sidebar', () => {
  const mockProjectId = 'test-project-id'
  const mockDocumentFiles = [
    {
      name: '설계서.pdf',
      url: 'https://example.com/design.pdf',
      type: 'design',
      createdAt: '2026-01-26T10:00:00Z',
    },
  ]

  it('사이드바가 렌더링됩니다', () => {
    render(
      <Sidebar
        projectId={mockProjectId}
        activeSection="design"
        documentFiles={mockDocumentFiles}
      />
    )

    // 여러 요소가 있을 수 있으므로 getAllByText 사용
    expect(screen.getAllByText(/설계/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/실행/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/감리/i).length).toBeGreaterThan(0)
  })

  it('문서 섹션이 표시됩니다', () => {
    render(
      <Sidebar
        projectId={mockProjectId}
        activeSection="design"
        documentFiles={mockDocumentFiles}
      />
    )

    expect(screen.getByText(/문서/i)).toBeInTheDocument()
    expect(screen.getByText(/설계서.pdf/i)).toBeInTheDocument()
  })

  it('활성 섹션이 하이라이트됩니다', () => {
    const { rerender } = render(
      <Sidebar
        projectId={mockProjectId}
        activeSection="design"
        documentFiles={[]}
      />
    )

    // 설계봇 링크가 활성화되어 있는지 확인
    const designLink = screen.getByText(/설계봇/i).closest('a')
    expect(designLink).toHaveClass(/bg-indigo|text-white/i)

    rerender(
      <Sidebar
        projectId={mockProjectId}
        activeSection="execute"
        documentFiles={[]}
      />
    )

    // Phase 목록 링크가 활성화되어 있는지 확인
    const executeLink = screen.getByText(/Phase 목록/i).closest('a')
    expect(executeLink).toHaveClass(/bg-indigo|text-white/i)
  })
})
