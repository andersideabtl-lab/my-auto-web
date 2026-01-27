/**
 * Auth 유틸리티 테스트
 */

import { isEmailAllowed } from '@/lib/auth'

describe('isEmailAllowed', () => {
  const originalEnv = process.env.ALLOWED_EMAILS

  afterEach(() => {
    process.env.ALLOWED_EMAILS = originalEnv
  })

  it('환경변수가 없으면 모든 이메일을 허용합니다', () => {
    delete process.env.ALLOWED_EMAILS
    expect(isEmailAllowed('test@example.com')).toBe(true)
  })

  it('허용된 이메일을 확인합니다', () => {
    process.env.ALLOWED_EMAILS = 'user1@company.com,user2@company.com'
    expect(isEmailAllowed('user1@company.com')).toBe(true)
    expect(isEmailAllowed('user2@company.com')).toBe(true)
  })

  it('허용되지 않은 이메일을 거부합니다', () => {
    process.env.ALLOWED_EMAILS = 'user1@company.com,user2@company.com'
    expect(isEmailAllowed('user3@company.com')).toBe(false)
  })

  it('대소문자를 구분하지 않습니다', () => {
    process.env.ALLOWED_EMAILS = 'User1@Company.com'
    expect(isEmailAllowed('user1@company.com')).toBe(true)
    expect(isEmailAllowed('USER1@COMPANY.COM')).toBe(true)
  })

  it('공백을 무시합니다', () => {
    process.env.ALLOWED_EMAILS = 'user1@company.com, user2@company.com '
    expect(isEmailAllowed('user1@company.com')).toBe(true)
    expect(isEmailAllowed('user2@company.com')).toBe(true)
  })
})
