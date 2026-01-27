import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
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

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 생성자 이메일 추가
    const projectWithCreator = {
      ...project,
      creator_email: user.email || null,
    }

    return NextResponse.json(projectWithCreator)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
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

    // 프로젝트가 존재하고 사용자가 소유자인지 확인
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // JSON 처리
    let body: any
    try {
      body = await request.json()
    } catch {
      // JSON 파싱 실패 시 빈 객체
      body = {}
    }

    const {
      description,
      name,
      validation_result,
      conversation_history,
      final_decisions,
      document_files,
      design_state,
      analysis_state,
      creation_mode,
      uploaded_file_path,
    } = body

    const updateData: any = {}
    if (description !== undefined) updateData.description = description
    if (name !== undefined) updateData.name = name
    if (validation_result !== undefined)
      updateData.validation_result = validation_result
    if (conversation_history !== undefined)
      updateData.conversation_history = conversation_history
    if (final_decisions !== undefined)
      updateData.final_decisions = final_decisions
    if (document_files !== undefined)
      updateData.document_files = document_files
    if (design_state !== undefined) updateData.design_state = design_state
    if (analysis_state !== undefined) updateData.analysis_state = analysis_state
    if (creation_mode !== undefined) updateData.creation_mode = creation_mode
    if (uploaded_file_path !== undefined) updateData.uploaded_file_path = uploaded_file_path

    const { data, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
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

    // 먼저 프로젝트가 존재하고 사용자가 소유자인지 확인
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 소프트 삭제: status를 'deleted'로 변경하거나 실제 삭제
    // 여기서는 실제 삭제로 구현
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
