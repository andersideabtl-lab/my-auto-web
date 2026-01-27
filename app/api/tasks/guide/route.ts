import { createGeminiClient } from '@/lib/gemini'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskName, taskType, completionCriteria, projectOverview } = body

    if (!taskName) {
      return NextResponse.json(
        { error: '태스크 이름이 필요합니다.' },
        { status: 400 }
      )
    }

    const genAI = await createGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `다음 태스크를 수행하기 위한 단계별 가이드를 제공해주세요.

태스크: ${taskName}
유형: ${taskType}
완료 기준: ${completionCriteria || '없음'}

${projectOverview ? `프로젝트 정보:\n${JSON.stringify(projectOverview, null, 2)}` : ''}

다음 형식으로 가이드를 작성해주세요:
1. 준비사항
2. 단계별 실행 방법
3. 확인 사항
4. 문제 해결 팁

구체적이고 실행 가능한 가이드를 제공해주세요.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const guide = response.text()

    return NextResponse.json({ guide })
  } catch (error: any) {
    console.error('가이드 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || '가이드 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
