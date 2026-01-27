import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { safeParseJSON } from '@/lib/json-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const supabase = await createClient()
    const { jobId } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 프로젝트에서 작업 상태 조회
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, design_job_state')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: '프로젝트 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 모든 프로젝트에서 해당 jobId 찾기
    for (const project of projects || []) {
      if (project.design_job_state) {
        const jobState = safeParseJSON(project.design_job_state, false)
        if (jobState && jobState[jobId]) {
          return NextResponse.json({
            jobId,
            status: jobState[jobId].status,
            result: jobState[jobId].result,
            error: jobState[jobId].error,
            updatedAt: jobState[jobId].updatedAt,
            projectId: project.id,
          })
        }
      }
    }

    return NextResponse.json(
      { error: '작업을 찾을 수 없습니다.' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Job status check error:', error)
    return NextResponse.json(
      { error: error.message || '작업 상태 확인에 실패했습니다.' },
      { status: 500 }
    )
  }
}
