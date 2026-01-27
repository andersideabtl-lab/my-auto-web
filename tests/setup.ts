/**
 * 테스트 환경 설정
 */

import '@testing-library/jest-dom'

// fetch 모킹
global.fetch = jest.fn()

// scrollIntoView 모킹
Element.prototype.scrollIntoView = jest.fn()

// window.confirm 모킹
window.confirm = jest.fn(() => true)

// Next.js 라우터 모킹
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// 전역에서 접근 가능하도록 export
export { mockPush, mockReplace, mockRefresh }

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  })),
}))

// 환경 변수 설정
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.ALLOWED_EMAILS = 'test@example.com'
process.env.NODE_ENV = 'test'
