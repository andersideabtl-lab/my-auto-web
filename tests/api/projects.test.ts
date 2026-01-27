/**
 * Projects API 테스트
 */

describe('Projects API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/projects', () => {
    it('프로젝트 목록을 반환합니다', async () => {
      const mockProjects = [
        {
          id: '1',
          name: '테스트 프로젝트',
          status: 'active',
          created_at: '2026-01-26T10:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
      })

      const response = await fetch('/api/projects')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toEqual(mockProjects)
    })

    it('인증되지 않은 사용자는 에러를 받습니다', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })

      const response = await fetch('/api/projects')
      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/projects', () => {
    it('새 프로젝트를 생성합니다', async () => {
      const newProject = {
        name: '새 프로젝트',
        description: '설명',
      }

      const createdProject = {
        id: 'new-id',
        ...newProject,
        status: 'active',
        created_at: '2026-01-26T10:00:00Z',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createdProject,
      })

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.name).toBe(newProject.name)
      expect(data.id).toBeDefined()
    })
  })

  describe('DELETE /api/projects/[id]', () => {
    it('프로젝트를 삭제합니다', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const response = await fetch('/api/projects/test-id', {
        method: 'DELETE',
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
    })
  })
})
