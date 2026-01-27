/**
 * TaskList 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TaskList from '@/components/TaskList'
import { mockTasksResponse } from '../mocks/api-responses'

// TaskGuide 모킹
jest.mock('@/components/TaskGuide', () => {
  return function MockTaskGuide({ task }: { task: any }) {
    return <div>TaskGuide: {task.name}</div>
  }
})

describe('TaskList', () => {
  const mockPhaseId = 'phase-1'
  const mockOnUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  it('Task 목록을 렌더링합니다', () => {
    render(
      <TaskList
        phaseId={mockPhaseId}
        tasks={mockTasksResponse}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByText(/사용자 인증 구현/i)).toBeInTheDocument()
    expect(screen.getByText(/상품 목록 구현/i)).toBeInTheDocument()
  })

  it('빈 Task 목록을 처리합니다', () => {
    render(
      <TaskList phaseId={mockPhaseId} tasks={[]} onUpdate={mockOnUpdate} />
    )

    expect(screen.getByText(/태스크가 없습니다/i)).toBeInTheDocument()
  })

  it('Task 체크박스가 작동합니다', () => {
    render(
      <TaskList
        phaseId={mockPhaseId}
        tasks={mockTasksResponse}
        onUpdate={mockOnUpdate}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)

    const firstCheckbox = checkboxes[0]
    expect(firstCheckbox).toBeChecked() // done 상태의 task
  })

  it('Task 상태 변경이 작동합니다', async () => {
    render(
      <TaskList
        phaseId={mockPhaseId}
        tasks={mockTasksResponse}
        onUpdate={mockOnUpdate}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    if (checkboxes.length > 1) {
      fireEvent.click(checkboxes[1]) // in-progress 상태의 task

      await waitFor(() => {
        // API 호출 확인
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/tasks/${mockTasksResponse[1].id}`,
          expect.objectContaining({
            method: 'PATCH',
          })
        )
      })
    }
  })
})
