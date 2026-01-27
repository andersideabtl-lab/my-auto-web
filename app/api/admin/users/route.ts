import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * 관리자 사용자 목록 API
 * 
 * 참고: Supabase Admin API를 사용하려면 SERVICE_ROLE_KEY가 필요합니다.
 * .env.local에 다음을 추가하세요:
 * SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 * 
 * 그리고 lib/supabase/admin.ts를 생성하여 Admin 클라이언트를 만들어야 합니다.
 */

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: 관리자 권한 체크 추가 필요
    // 예: const isAdmin = await checkAdminRole(user.id)

    // 현재는 일반 클라이언트로는 모든 사용자 목록을 가져올 수 없으므로
    // projects 테이블에서 user_id를 기반으로 사용자 정보를 수집
    // 또는 Supabase Admin API를 사용해야 합니다.

    // 임시: projects 테이블에서 고유한 user_id 목록 가져오기
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('user_id, created_at')
      .order('created_at', { ascending: false })

    if (projectsError) {
      return NextResponse.json(
        { error: projectsError.message },
        { status: 500 }
      )
    }

    // 고유한 user_id 추출
    const uniqueUserIds = Array.from(
      new Set(projects?.map((p) => p.user_id) || [])
    )

    // 각 사용자 정보 가져오기 (현재 사용자 정보만 가져올 수 있음)
    // 실제로는 Admin API가 필요합니다.
    const users = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        // 현재는 자신의 정보만 가져올 수 있으므로
        // 실제 구현에서는 Admin API를 사용해야 합니다.
        if (userId === user.id) {
          return {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            email_confirmed_at: user.email_confirmed_at,
          }
        }
        return null
      })
    )

    return NextResponse.json({
      users: users.filter((u) => u !== null),
      note: '실제 구현에서는 Supabase Admin API를 사용하여 모든 사용자 목록을 가져와야 합니다.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '사용자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
