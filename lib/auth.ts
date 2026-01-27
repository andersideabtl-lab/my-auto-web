/**
 * 이메일 화이트리스트 검증 유틸리티
 */

/**
 * 이메일이 허용된 목록에 있는지 확인
 * @param email 확인할 이메일 주소
 * @returns 이메일이 허용되면 true, 아니면 false
 */
export function isEmailAllowed(email: string): boolean {
  const allowedEmails = process.env.ALLOWED_EMAILS

  // 환경변수가 설정되지 않았으면 모든 이메일 허용 (개발 환경)
  if (!allowedEmails) {
    return true
  }

  // 쉼표로 구분된 이메일 목록 파싱
  const allowedList = allowedEmails.split(',').map((e) => e.trim().toLowerCase())

  // 이메일을 소문자로 변환하여 비교
  const normalizedEmail = email.trim().toLowerCase()

  return allowedList.includes(normalizedEmail)
}
