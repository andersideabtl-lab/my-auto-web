/**
 * ProjectTabs 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react'
import ProjectTabs from '@/components/ProjectTabs'

// DesignBot, ExecuteBot, SuperviseBot 모킹
jest.mock('@/components/DesignBot', () => {
  return function MockDesignBot({ projectId }: { projectId: string }) {
    return <div>DesignBot: {projectId}</div>
  }
})

jest.mock('@/components/ExecuteBot', () => {
  return function MockExecuteBot({ projectId }: { projectId: string }) {
    return <div>ExecuteBot: {projectId}</div>
  }
})

jest.mock('@/components/SuperviseBot', () => {
  return function MockSuperviseBot({ projectId }: { projectId: string }) {
    return <div>SuperviseBot: {projectId}</div>
  }
})

describe('ProjectTabs', () => {
  const mockProjectId = 'test-project-id'

  it('탭이 렌더링됩니다', () => {
    render(
      <ProjectTabs
        projectId={mockProjectId}
        activeSection="design"
        initialOverview={null}
      />
    )

    expect(screen.getByText(/설계봇/i)).toBeInTheDocument()
    expect(screen.getByText(/실행봇/i)).toBeInTheDocument()
    expect(screen.getByText(/감리봇/i)).toBeInTheDocument()
  })

  it('기본적으로 설계봇이 활성화됩니다', () => {
    render(
      <ProjectTabs
        projectId={mockProjectId}
        activeSection="design"
        initialOverview={null}
      />
    )

    expect(screen.getByText(/DesignBot/i)).toBeInTheDocument()
  })

  it('탭 클릭 시 컨텐츠가 변경됩니다', () => {
    render(
      <ProjectTabs
        projectId={mockProjectId}
        activeSection="design"
        initialOverview={null}
      />
    )

    const executeTab = screen.getByText(/실행봇/i)
    fireEvent.click(executeTab)

    // 탭 전환 확인 (실제로는 상태 관리가 필요)
    expect(screen.getByText(/ExecuteBot/i)).toBeInTheDocument()
  })
})
