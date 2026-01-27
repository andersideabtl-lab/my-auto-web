import { createAnthropicClient } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { safeParseJSON } from '@/lib/json-utils'

export const maxDuration = 300 // 5분

interface DesignJob {
  id: string
  projectId: string
  step: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
}

// 메모리 기반 작업 저장소 (실제로는 DB에 저장하는 것이 좋음)
const jobStore = new Map<string, DesignJob>()

// 백그라운드 작업 실행
async function executeDesignJob(jobId: string, step: string, answers: any, projectType?: string) {
  const job = jobStore.get(jobId)
  if (!job) return

  try {
    job.status = 'processing'
    jobStore.set(jobId, job)

    const anthropic = await createAnthropicClient()
    let systemPrompt = ''
    let userMessage = ''

    switch (step) {
      case 'analyze':
        systemPrompt = `당신은 프로젝트 설계 전문가입니다. 사용자의 초기 답변을 바탕으로 프로젝트 유형을 파악하고, 해당 유형에 맞는 핵심 질문 5-7개를 생성해주세요.

질문은 다음 형식의 JSON으로 응답하세요:
{
  "projectType": "프로젝트 유형 (예: 쇼핑몰, SaaS, SNS, 블로그, 포트폴리오 등)",
  "questions": [
    "질문 1",
    "질문 2",
    ...
  ],
  "reasoning": "이 프로젝트 유형을 선택한 이유와 질문 생성 근거"
}

질문은 구체적이고 실용적이어야 하며, 프로젝트의 핵심 기능과 요구사항을 파악할 수 있어야 합니다.`
        userMessage = `사용자 답변:
${Object.entries(answers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

프로젝트 유형을 분석하고 맞춤 질문을 생성해주세요.`
        break

      case 'techStack':
        systemPrompt = `당신은 기술 스택 전문가입니다. 프로젝트 정보를 바탕으로 3가지 기술 스택 옵션을 제안해주세요.

다음 형식의 JSON으로 응답하세요:
{
  "options": [
    {
      "name": "옵션 이름 (예: Modern Stack, Classic Stack, Lightweight Stack)",
      "stack": {
        "frontend": "프론트엔드 기술",
        "backend": "백엔드 기술",
        "database": "데이터베이스",
        "deployment": "배포 플랫폼"
      },
      "pros": ["장점 1", "장점 2", "장점 3"],
      "cons": ["단점 1", "단점 2"],
      "reason": "이 스택을 추천하는 이유"
    }
  ]
}

각 옵션은 서로 다른 접근 방식을 제시해야 합니다 (예: 풀스택 vs 분리, 모던 vs 안정적).`
        userMessage = `프로젝트 정보:
${Object.entries(answers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

프로젝트 유형: ${projectType}

3가지 기술 스택 옵션을 제안해주세요.`
        break

      case 'realityCheck':
        systemPrompt = `당신은 프로젝트 관리 전문가입니다. 프로젝트의 현실성을 체크하고, 단계별 Phase 구조를 제안해주세요.

다음 형식의 JSON으로 응답하세요:
{
  "warnings": [
    "경고 메시지 1 (예: 기한이 너무 짧음)",
    "경고 메시지 2"
  ],
  "risks": [
    {
      "type": "위험 유형",
      "description": "위험 설명",
      "mitigation": "완화 방안"
    }
  ],
  "phases": [
    {
      "name": "Phase 1 이름",
      "duration": "예상 기간",
      "features": ["기능 1", "기능 2"],
      "milestones": ["마일스톤 1", "마일스톤 2"]
    }
  ],
  "recommendation": "전체적인 추천 사항"
}

현실적이고 실행 가능한 Phase 구조를 제안해주세요.`
        userMessage = `프로젝트 정보:
${Object.entries(answers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

프로젝트 유형: ${projectType}
기술 스택: ${answers.techStack || '미선택'}

현실성을 체크하고 Phase 구조를 제안해주세요.`
        break

      case 'final':
        systemPrompt = `당신은 프로젝트 문서화 전문가입니다. 모든 정보를 종합하여 구조화된 프로젝트 개요를 생성해주세요.

다음 형식의 JSON으로 응답하세요:
{
  "type": "프로젝트 유형",
  "goal": "프로젝트 목표",
  "targetUsers": "주 사용자",
  "features": ["기능 1", "기능 2", "기능 3"],
  "techStack": {
    "frontend": "프론트엔드",
    "backend": "백엔드",
    "database": "데이터베이스",
    "deployment": "배포"
  },
  "timeline": "전체 예상 기간",
  "phases": [
    {
      "name": "Phase 이름",
      "duration": "기간",
      "features": ["기능들"]
    }
  ],
  "risks": ["위험 요소들"],
  "successCriteria": "성공 기준",
  "summary": "프로젝트 전체 요약 (2-3문장)"
}`
        userMessage = `프로젝트 정보:
${JSON.stringify(answers, null, 2)}

프로젝트 개요를 생성해주세요.`
        break

      default:
        throw new Error('Invalid step')
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    const text = response.content[0].text
    const result = safeParseJSON(text)

    // 결과를 DB에 저장
    const supabase = await createClient()
    await supabase
      .from('projects')
      .update({
        design_job_state: JSON.stringify({
          [jobId]: {
            status: 'completed',
            result,
            updatedAt: new Date().toISOString(),
          },
        }),
      })
      .eq('id', job.projectId)

    job.status = 'completed'
    job.result = result
    job.updatedAt = new Date().toISOString()
    jobStore.set(jobId, job)
  } catch (error: any) {
    job.status = 'failed'
    job.error = error.message
    job.updatedAt = new Date().toISOString()
    jobStore.set(jobId, job)

    // 에러도 DB에 저장
    const supabase = await createClient()
    await supabase
      .from('projects')
      .update({
        design_job_state: JSON.stringify({
          [jobId]: {
            status: 'failed',
            error: error.message,
            updatedAt: new Date().toISOString(),
          },
        }),
      })
      .eq('id', job.projectId)
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
    const { step, answers, projectType, projectId } = body

    if (!step || !answers || !projectId) {
      return NextResponse.json(
        { error: 'step, answers, projectId가 필요합니다.' },
        { status: 400 }
      )
    }

    // 프로젝트 소유권 확인
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 작업 ID 생성
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 작업 생성
    const job: DesignJob = {
      id: jobId,
      projectId,
      step,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    jobStore.set(jobId, job)

    // 백그라운드에서 작업 시작 (비동기, await 하지 않음)
    executeDesignJob(jobId, step, answers, projectType).catch((error) => {
      console.error('Background job error:', error)
    })

    return NextResponse.json({
      jobId,
      status: 'pending',
      message: '작업이 시작되었습니다. 백그라운드에서 처리됩니다.',
    })
  } catch (error: any) {
    console.error('Design job start error:', error)
    return NextResponse.json(
      { error: error.message || '작업 시작에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 작업 상태 조회를 위한 GET 엔드포인트
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId가 필요합니다.' }, { status: 400 })
  }

  const job = jobStore.get(jobId)
  if (!job) {
    return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    result: job.result,
    error: job.error,
    updatedAt: job.updatedAt,
  })
}
