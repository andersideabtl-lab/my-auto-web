import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const phaseId = searchParams.get('phase_id')

    if (!phaseId) {
      return NextResponse.json(
        { error: 'phase_id가 필요합니다.' },
        { status: 400 }
      )
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Phase 소유권 확인
    const { data: phase } = await supabase
      .from('phases')
      .select('project_id')
      .eq('id', phaseId)
      .single()

    if (!phase) {
      return NextResponse.json({ error: 'Phase를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', phase.project_id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Task 목록 가져오기
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('phase_id', phaseId)
      .order('order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tasks || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Task 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phase_id, name, type, completion_criteria, order } = body

    if (!phase_id || !name) {
      return NextResponse.json(
        { error: 'Phase ID와 Task 이름이 필요합니다.' },
        { status: 400 }
      )
    }

    // Phase 소유권 확인
    const { data: phase } = await supabase
      .from('phases')
      .select('project_id, projects!inner(user_id)')
      .eq('id', phase_id)
      .single()

    if (!phase || (phase.projects as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Task 생성
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        phase_id,
        name,
        type: type || 'development',
        status: 'todo',
        completion_criteria: completion_criteria || null,
        order: order || 0,
        notes: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Task 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
