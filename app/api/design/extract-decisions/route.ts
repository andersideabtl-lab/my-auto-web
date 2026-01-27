import { createAnthropicClient } from '@/lib/anthropic'
import { safeParseJSON } from '@/lib/json-utils'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const anthropic = await createAnthropicClient()
    const body = await request.json()
    const { conversationHistory } = body

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: '대화 내역이 필요합니다.' },
        { status: 400 }
      )
    }

    const conversationText = conversationHistory
      .map((item: any) => {
        if (item.type === 'question') {
          return `질문: ${item.content}`
        } else if (item.type === 'answer') {
          return `답변: ${item.answer || item.content}`
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')

    const systemPrompt = `당신은 프로젝트 관리 전문가입니다. 대화 내역에서 최종 결정사항을 추출하고 다음 3가지 카테고리로 분류해주세요:

1. completed: 협의가 완료되고 확정된 결정사항
2. pending: 현재 협의 중이거나 보류된 결정사항
3. deferred: 미래로 미뤄진 결정사항

다음 형식의 JSON으로 응답하세요:
{
  "completed": [
    {
      "decision": "결정 내용",
      "reason": "결정 이유"
    }
  ],
  "pending": [
    {
      "decision": "협의 중인 내용",
      "reason": "협의가 필요한 이유"
    }
  ],
  "deferred": [
    {
      "decision": "미뤄진 내용",
      "reason": "미루게 된 이유"
    }
  ]
}

결정사항은 구체적이고 명확하게 추출해주세요.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `다음 대화 내역에서 최종 결정사항을 추출해주세요:\n\n${conversationText}`,
        },
      ],
    })

    const text = response.content[0].text
    const finalDecisions = safeParseJSON(text)

    return NextResponse.json({ finalDecisions })
  } catch (error: any) {
    console.error('Final decisions extraction error:', error)
    return NextResponse.json(
      {
        error: error.message || '최종 결정사항 추출에 실패했습니다.',
        finalDecisions: {
          completed: [],
          pending: [],
          deferred: [],
        },
      },
      { status: 500 }
    )
  }
}
