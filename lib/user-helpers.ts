import { createClient } from '@/lib/supabase/server'

/**
 * user_id로 이메일 조회
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    // auth.users에서 직접 조회는 불가능하므로, 
    // projects 테이블을 통해 간접 조회하거나
    // 별도 users 테이블 사용
    
    // 간단한 방법: 현재 사용자만 조회 가능
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (user && user.id === userId) {
      return user.email || null
    }
    
    // 다른 사용자의 경우, projects를 통해 조회 시도
    // (실제로는 users 테이블이나 별도 매핑 필요)
    return null
  } catch (error) {
    console.error('Error fetching user email:', error)
    return null
  }
}

/**
 * 여러 user_id로 이메일 조회 (배치)
 */
export async function getUserEmails(userIds: string[]): Promise<Record<string, string>> {
  const emails: Record<string, string> = {}
  
  // 현재는 현재 사용자만 조회 가능
  // 실제로는 users 테이블이나 별도 매핑 필요
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (user && userIds.includes(user.id)) {
    emails[user.id] = user.email || ''
  }
  
  return emails
}
