import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 각 프로젝트에 생성자 이메일 추가
    const projectsWithCreator = (data || []).map((project) => ({
      ...project,
      creator_email: user.email || null,
    }))

    return NextResponse.json(projectsWithCreator)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, creation_mode, uploaded_file_path } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const insertData: any = {
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      status: 'active',
      creation_mode: creation_mode || 'new', // 기본값 'new'
    }

    // uploaded_file_path 추가 (필드가 있는 경우)
    if (uploaded_file_path) {
      insertData.uploaded_file_path = uploaded_file_path
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 생성자 이메일 추가
    const projectWithCreator = {
      ...data,
      creator_email: user.email || null,
    }

    return NextResponse.json(projectWithCreator, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
