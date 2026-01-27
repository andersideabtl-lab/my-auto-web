import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/anthropic'
import { safeParseJSON } from '@/lib/json-utils'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const filePath = searchParams.get('filePath')

    if (!projectId || !filePath) {
      return NextResponse.json(
        { error: '프로젝트 ID와 파일 경로가 필요합니다.' },
        { status: 400 }
      )
    }

    // 프로젝트 소유권 확인
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Storage에서 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('ai-project-documents')
      .download(filePath)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: '파일을 다운로드할 수 없습니다.' },
        { status: 404 }
      )
    }

    // 파일 내용 읽기
    const fileContent = await fileData.text()

    // Claude API로 설계서 분석
    const anthropic = await createAnthropicClient()
    const systemPrompt = `당신은 프로젝트 설계서 분석 전문가입니다. 주어진 설계서 내용을 분석하여 다음 형식의 JSON을 추출해주세요:

{
  "goal": "프로젝트 목표",
  "targetUsers": "주 사용자",
  "features": ["기능 1", "기능 2", "기능 3"],
  "techStack": {
    "frontend": "프론트엔드 기술",
    "backend": "백엔드 기술",
    "database": "데이터베이스",
    "deployment": "배포 플랫폼"
  },
  "timeline": "예상 기간",
  "phases": [
    {
      "name": "Phase 이름",
      "duration": "기간",
      "features": ["기능들"]
    }
  ],
  "risks": ["위험 요소 1", "위험 요소 2"],
  "summary": "프로젝트 전체 요약 (2-3문장)"
}

JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `다음 설계서를 분석해주세요:\n\n${fileContent.substring(0, 100000)}`,
        },
      ],
    })

    const text = response.content[0].text
    const overview = safeParseJSON(text) || {
      goal: '설계서에서 추출된 목표',
      targetUsers: '사용자',
      features: [],
      techStack: {},
      timeline: '미정',
      phases: [],
      risks: [],
      summary: '설계서가 업로드되었습니다.',
    }

    return NextResponse.json({ overview })
  } catch (error: any) {
    console.error('Upload analysis error:', error)
    return NextResponse.json(
      { error: error.message || '분석에 실패했습니다.' },
      { status: 500 }
    )
  }
}
