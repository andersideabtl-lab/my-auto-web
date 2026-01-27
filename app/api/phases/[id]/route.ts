import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, duration_weeks, status, order } = body

    // Phase 소유권 확인
    const { data: phase } = await supabase
      .from('phases')
      .select('project_id, projects!inner(user_id)')
      .eq('id', id)
      .single()

    if (!phase || (phase.projects as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (duration_weeks !== undefined) updateData.duration_weeks = duration_weeks
    if (status !== undefined) updateData.status = status
    if (order !== undefined) updateData.order = order
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('phases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Phase가 완료되면 리포트 자동 생성 (비동기)
    if (status === 'completed' && data) {
      const projectId = (phase as any).project_id
      // 백그라운드에서 리포트 생성 (await 하지 않음)
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          reportType: 'phase',
          phaseId: id,
        }),
      }).catch((reportError) => {
        console.error('Phase 리포트 생성 오류:', reportError)
        // 리포트 생성 실패해도 Phase 업데이트는 성공
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Phase 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Phase 소유권 확인
    const { data: phase } = await supabase
      .from('phases')
      .select('project_id, projects!inner(user_id)')
      .eq('id', id)
      .single()

    if (!phase || (phase.projects as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 관련 태스크도 삭제
    await supabase.from('tasks').delete().eq('phase_id', id)

    // Phase 삭제
    const { error } = await supabase.from('phases').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Phase 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
