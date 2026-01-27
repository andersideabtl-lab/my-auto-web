import { createClient } from '@/lib/supabase/server'

/**
 * 사용자 역할 확인
 * 캐싱 없이 항상 실시간 DB 조회
 */
export async function getUserRole(): Promise<'admin' | 'user' | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log('[AUTH] getUserRole: No user found')
    return null
  }

  console.log(`[AUTH] getUserRole: Checking role for user ${user.id} (${user.email})`)

  // users 테이블에서 role 조회 (캐싱 없이 항상 실시간 조회)
  // RLS 정책으로 인해 자신의 레코드는 조회 가능해야 함
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle() // single() 대신 maybeSingle() 사용 (레코드가 없어도 에러 발생 안 함)

  // 레코드가 없으면 생성 시도
  if (error) {
    // 에러 상세 정보를 JSON으로 직렬화하여 로깅
    const errorInfo = {
      message: error.message || 'Unknown error',
      code: error.code || 'NO_CODE',
      details: error.details || null,
      hint: error.hint || null,
    }
    console.error(`[AUTH] Error fetching user role for ${user.id}:`, JSON.stringify(errorInfo, null, 2))
    
    // 레코드가 없는 경우 자동 생성 시도
    if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
      console.log(`[AUTH] User record not found for ${user.id}, attempting to create...`)
      try {
        // 첫 사용자인지 확인하여 admin 또는 user로 설정
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
        
        if (countError) {
          console.error(`[AUTH] Error counting users:`, JSON.stringify({
            message: countError.message,
            code: countError.code,
            details: countError.details,
          }, null, 2))
          return 'user'
        }
        
        const isFirstUser = (count || 0) === 0
        const role = isFirstUser ? 'admin' : 'user'
        
        console.log(`[AUTH] Attempting to create user record: isFirstUser=${isFirstUser}, role=${role}`)
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            role: role,
          })
        
        if (insertError) {
          console.error('[AUTH] Failed to create user record:', JSON.stringify({
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          }, null, 2))
          return 'user'
        }
        
        console.log(`[AUTH] User record created successfully with role: ${role}`)
        return role as 'admin' | 'user'
      } catch (createError: any) {
        console.error('[AUTH] Exception while creating user record:', createError?.message || String(createError))
        return 'user'
      }
    }
    
    console.warn(`[AUTH] getUserRole: Error occurred (code: ${error.code || 'unknown'}), defaulting to 'user'`)
    return 'user'
  }

  if (!data) {
    console.warn(`[AUTH] User role not found for ${user.id}, attempting to create...`)
    
    // 레코드가 없는 경우 자동 생성 시도
    try {
      // 첫 사용자인지 확인하여 admin 또는 user로 설정
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error(`[AUTH] Error counting users:`, JSON.stringify({
          message: countError.message,
          code: countError.code,
          details: countError.details,
        }, null, 2))
        return 'user'
      }
      
      const isFirstUser = (count || 0) === 0
      const role = isFirstUser ? 'admin' : 'user'
      
      console.log(`[AUTH] Creating user record: isFirstUser=${isFirstUser}, role=${role}`)
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          role: role,
        })
      
      if (insertError) {
        console.error('[AUTH] Failed to create user record:', JSON.stringify({
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        }, null, 2))
        return 'user'
      }
      
      console.log(`[AUTH] User record created successfully with role: ${role}`)
      return role as 'admin' | 'user'
    } catch (createError: any) {
      console.error('[AUTH] Exception while creating user record:', createError?.message || String(createError))
      return 'user'
    }
  }

  const role = (data.role as 'admin' | 'user') || 'user'
  console.log(`[AUTH] getUserRole: Found role '${role}' for user ${user.id}`)
  return role
}

/**
 * 관리자 여부 확인
 * 캐싱 없이 항상 실시간 확인
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  const isAdminUser = role === 'admin'
  console.log(`[AUTH] isAdmin: ${isAdminUser} (role: ${role})`)
  return isAdminUser
}
