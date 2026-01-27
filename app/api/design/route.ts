import { createAnthropicClient } from '@/lib/anthropic'
import { NextRequest } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const anthropic = await createAnthropicClient()
    const body = await request.json()
    const { step, answers, projectType } = body

    let systemPrompt = ''
    let userMessage = ''

    switch (step) {
      case 'analyze':
        // 단계 2: 프로젝트 유형 분석 및 맞춤 질문 생성
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
        // 단계 3: 기술 스택 제안
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
        // 단계 4: 현실성 체크 및 Phase 제안
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
        // 최종: 프로젝트 개요 생성
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
        return new Response(
          JSON.stringify({ error: 'Invalid step' }),
          { status: 400 }
        )
    }

    const stream = await anthropic.messages.stream({
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

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const text = event.delta.text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            } else if (event.type === 'message_stop') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
              controller.close()
            }
          }
        } catch (error: any) {
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Design API error:', error)
    return new Response(
      JSON.stringify({ error: error.message || '설계 생성에 실패했습니다.' }),
      { status: 500 }
    )
  }
}
