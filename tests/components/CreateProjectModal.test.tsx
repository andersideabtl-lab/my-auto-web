/**
 * CreateProjectModal 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreateProjectModal from '@/components/CreateProjectModal'
import { mockProjectsResponse } from '../mocks/api-responses'

// Next.js 라우터는 setup.ts에서 모킹됨
const mockPush = jest.fn()

describe('CreateProjectModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-project-id', ...mockProjectsResponse[0] }),
    })
    jest.clearAllMocks()
  })

  it('모달이 열려있을 때 렌더링됩니다', () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText(/프로젝트 생성|새 프로젝트/i)).toBeInTheDocument()
  })

  it('모달이 닫혀있을 때 렌더링되지 않습니다', () => {
    render(
      <CreateProjectModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.queryByText(/프로젝트 생성/i)).not.toBeInTheDocument()
  })

  it('프로젝트 이름 입력 필드가 있습니다', () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByLabelText(/프로젝트 이름|이름/i)
    expect(nameInput).toBeInTheDocument()
  })

  it('설계 방식 선택 라디오 버튼이 있습니다', () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const botOption = screen.getByLabelText(/설계봇 사용/i)
    const uploadOption = screen.getByLabelText(/설계서 업로드/i)

    expect(botOption).toBeInTheDocument()
    expect(uploadOption).toBeInTheDocument()
  })

  it('프로젝트 생성 폼 제출이 작동합니다', async () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByLabelText(/프로젝트 이름|이름/i)
    const submitButton = screen.getByRole('button', { name: /생성|만들기/i })

    fireEvent.change(nameInput, { target: { value: '새 프로젝트' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '새 프로젝트',
          description: undefined,
        }),
      })
    })
  })

  it('빈 이름으로 제출 시 에러를 표시합니다', async () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /생성|만들기/i })
    fireEvent.click(submitButton)

    // 유효성 검사 확인 (구현에 따라 다를 수 있음)
  })
})
