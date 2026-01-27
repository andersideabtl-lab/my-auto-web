/**
 * ExecuteBot 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react'
import ExecuteBot from '@/components/ExecuteBot'

// PhaseList, ProgressDashboard 모킹
jest.mock('@/components/PhaseList', () => {
  return function MockPhaseList({ projectId }: { projectId: string }) {
    return <div>PhaseList: {projectId}</div>
  }
})

jest.mock('@/components/ProgressDashboard', () => {
  return function MockProgressDashboard({ projectId }: { projectId: string }) {
    return <div>ProgressDashboard: {projectId}</div>
  }
})

describe('ExecuteBot', () => {
  const mockProjectId = 'test-project-id'
  const mockProjectOverview = {
    type: '쇼핑몰',
    goal: '온라인 쇼핑몰 구축',
  }

  it('실행 관리 UI가 렌더링됩니다', () => {
    render(
      <ExecuteBot
        projectId={mockProjectId}
        projectOverview={mockProjectOverview}
      />
    )

    expect(screen.getByText(/실행 관리/i)).toBeInTheDocument()
    expect(screen.getByText(/Phase 목록/i)).toBeInTheDocument()
    expect(screen.getByText(/진행률 대시보드/i)).toBeInTheDocument()
  })

  it('기본적으로 Phase 목록이 표시됩니다', () => {
    render(
      <ExecuteBot
        projectId={mockProjectId}
        projectOverview={mockProjectOverview}
      />
    )

    expect(screen.getByText(/PhaseList/i)).toBeInTheDocument()
  })

  it('뷰 전환 버튼이 작동합니다', () => {
    render(
      <ExecuteBot
        projectId={mockProjectId}
        projectOverview={mockProjectOverview}
      />
    )

    const dashboardButton = screen.getByText(/진행률 대시보드/i)
    fireEvent.click(dashboardButton)

    // 뷰 전환 확인 (실제로는 상태 관리가 필요)
    expect(screen.getByText(/ProgressDashboard/i)).toBeInTheDocument()
  })
})
