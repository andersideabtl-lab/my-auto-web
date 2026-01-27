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
    const { name, type, status, completion_criteria, order, notes } = body

    // Task 소유권 확인
    const { data: task } = await supabase
      .from('tasks')
      .select('phase_id, phases!inner(project_id, projects!inner(user_id))')
      .eq('id', id)
      .single()

    if (
      !task ||
      ((task.phases as any).projects as any).user_id !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (completion_criteria !== undefined)
      updateData.completion_criteria = completion_criteria
    if (order !== undefined) updateData.order = order
    if (notes !== undefined) updateData.notes = notes
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Task 업데이트에 실패했습니다.' },
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

    // Task 소유권 확인
    const { data: task } = await supabase
      .from('tasks')
      .select('phase_id, phases!inner(project_id, projects!inner(user_id))')
      .eq('id', id)
      .single()

    if (
      !task ||
      ((task.phases as any).projects as any).user_id !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Task 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
