import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/anthropic'
import { safeParseJSON } from '@/lib/json-utils'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

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
    const { project_id } = body

    if (!project_id) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 프로젝트 정보 가져오기
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 프로젝트 개요 파싱
    let overview = null
    if (project.description) {
      try {
        overview = JSON.parse(project.description)
      } catch {
        overview = {}
      }
    }

    // Claude API로 Phase 생성
    const anthropic = await createAnthropicClient()

    const systemPrompt = `당신은 프로젝트 관리 전문가입니다. 프로젝트 정보를 바탕으로 3-5개의 Phase와 각 Phase당 5-10개의 Task를 생성해주세요.

다음 형식의 JSON으로 응답하세요:
{
  "phases": [
    {
      "phase_number": 1,
      "name": "Phase 이름",
      "duration_weeks": 2,
      "order": 0,
      "tasks": [
        {
          "name": "Task 이름",
          "type": "development",
          "completion_criteria": "완료 기준",
          "order": 0
        }
      ]
    }
  ]
}

Task type은 다음 중 하나: development, testing, documentation, deployment, other
각 Phase는 논리적 순서로 배치하고, Task는 구체적이고 실행 가능해야 합니다.`

    const projectInfo = JSON.stringify(overview, null, 2)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `다음 프로젝트 정보를 바탕으로 Phase와 Task를 생성해주세요:\n\n${projectInfo}`,
        },
      ],
    })

    const text = response.content[0].text
    const phaseData = safeParseJSON(text)

    // Phase와 Task 생성
    const createdPhases = []

    for (const phaseInfo of phaseData.phases) {
      // Phase 생성
      const { data: phase, error: phaseError } = await supabase
        .from('phases')
        .insert({
          project_id,
          phase_number: phaseInfo.phase_number,
          name: phaseInfo.name,
          duration_weeks: phaseInfo.duration_weeks || 1,
          status: 'pending',
          order: phaseInfo.order || 0,
        })
        .select()
        .single()

      if (phaseError) {
        console.error('Phase 생성 오류:', phaseError)
        continue
      }

      // Task 생성
      if (phaseInfo.tasks && Array.isArray(phaseInfo.tasks)) {
        for (const taskInfo of phaseInfo.tasks) {
          await supabase.from('tasks').insert({
            phase_id: phase.id,
            name: taskInfo.name,
            type: taskInfo.type || 'development',
            status: 'todo',
            completion_criteria: taskInfo.completion_criteria || null,
            order: taskInfo.order || 0,
            notes: null,
          })
        }
      }

      createdPhases.push(phase)
    }

    return NextResponse.json({
      success: true,
      phases: createdPhases,
      count: createdPhases.length,
    })
  } catch (error: any) {
    console.error('Phase 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || 'Phase 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
