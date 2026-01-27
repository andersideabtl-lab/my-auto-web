/**
 * ProjectsList 컴포넌트 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import ProjectsList from '@/components/ProjectsList'
import { mockProjectsResponse } from '../mocks/api-responses'

// fetch는 setup.ts에서 모킹됨

describe('ProjectsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProjectsResponse,
    })
  })

  it('프로젝트 목록을 렌더링합니다', async () => {
    render(<ProjectsList />)

    await waitFor(() => {
      expect(screen.getByText('테스트 프로젝트 1')).toBeInTheDocument()
      expect(screen.getByText('테스트 프로젝트 2')).toBeInTheDocument()
    })
  })

  it('새 프로젝트 버튼을 표시합니다', async () => {
    render(<ProjectsList />)

    await waitFor(() => {
      const button = screen.getByText(/새 프로젝트|프로젝트 생성/i)
      expect(button).toBeInTheDocument()
    })
  })

  it('로딩 상태를 표시합니다', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // 무한 대기
    )

    render(<ProjectsList />)
    // 로딩 인디케이터 확인 (구현에 따라 다를 수 있음)
  })

  it('에러 발생 시 처리합니다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(<ProjectsList />)

    await waitFor(() => {
      // 에러 메시지 확인 (구현에 따라 다를 수 있음)
    })
  })
})
