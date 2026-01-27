/**
 * CredentialsManager 컴포넌트 테스트
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import CredentialsManager from '@/components/CredentialsManager'

// AddCredentialModal 모킹
jest.mock('@/components/AddCredentialModal', () => {
  return function MockAddCredentialModal({
    isOpen,
    onClose,
  }: {
    isOpen: boolean
    onClose: () => void
  }) {
    if (!isOpen) return null
    return (
      <div>
        <div>AddCredentialModal</div>
        <button onClick={onClose}>닫기</button>
      </div>
    )
  }
})

// CredentialCard 모킹
jest.mock('@/components/CredentialCard', () => {
  return function MockCredentialCard({
    credential,
    onDelete,
    onVerify,
  }: {
    credential: any
    onDelete: (id: string) => void
    onVerify: (id: string) => void
  }) {
    return (
      <div>
        <div>{credential.display_name || credential.service}</div>
        <button onClick={() => onDelete(credential.id)}>삭제</button>
        <button onClick={() => onVerify(credential.id)}>테스트</button>
      </div>
    )
  }
})

describe('CredentialsManager', () => {
  const mockCredentials = [
    {
      id: '1',
      service: 'claude',
      service_name: 'claude',
      display_name: 'Claude API',
      api_key: 'sk-ant-***',
      is_valid: true,
      last_verified: '2026-01-26T10:00:00Z',
      management_url: 'https://console.anthropic.com',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockCredentials,
    })
  })

  it('API 키 목록을 렌더링합니다', async () => {
    render(<CredentialsManager />)

    await waitFor(() => {
      expect(screen.getByText(/Claude API/i)).toBeInTheDocument()
    })
  })

  it('계정 추가 버튼이 있습니다', async () => {
    render(<CredentialsManager />)

    await waitFor(() => {
      const addButton = screen.getByText(/계정 추가|추가/i)
      expect(addButton).toBeInTheDocument()
    })
  })

  it('계정 추가 버튼 클릭 시 모달이 열립니다', async () => {
    render(<CredentialsManager />)

    await waitFor(() => {
      const addButton = screen.getByText(/계정 추가|추가/i)
      fireEvent.click(addButton)
      expect(screen.getByText(/AddCredentialModal/i)).toBeInTheDocument()
    })
  })
})
