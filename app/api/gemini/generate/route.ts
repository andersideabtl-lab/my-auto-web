import { createGeminiClient } from '@/lib/gemini'
import { safeParseJSON } from '@/lib/json-utils'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { answers } = body

    const genAI = await createGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const questions = [
      { key: 'goal', text: '프로젝트 목표는?' },
      { key: 'targetUsers', text: '주 사용자는?' },
      { key: 'coreFeatures', text: '핵심 기능 3가지는?' },
      { key: 'deadline', text: '완료 기한은?' },
      { key: 'teamSize', text: '팀 규모는?' },
      { key: 'techStack', text: '기술 스택 선호는?' },
      { key: 'budget', text: '예산은?' },
      { key: 'priorities', text: '우선순위는?' },
      { key: 'constraints', text: '제약사항은?' },
      { key: 'successCriteria', text: '성공 기준은?' },
    ]

    const prompt = `다음 프로젝트 정보를 바탕으로 구조화된 프로젝트 개요 JSON을 생성해주세요. 
JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요.

프로젝트 정보:
${Object.entries(answers)
  .map(([key, value]) => {
    const question = questions.find((q) => q.key === key)
    return `${question?.text}: ${value}`
  })
  .join('\n')}

다음 형식의 JSON을 생성해주세요:
{
  "goal": "프로젝트 목표",
  "targetUsers": "주 사용자",
  "coreFeatures": ["기능1", "기능2", "기능3"],
  "deadline": "완료 기한",
  "teamSize": "팀 규모",
  "techStack": ["기술1", "기술2"],
  "budget": "예산",
  "priorities": "우선순위",
  "constraints": "제약사항",
  "successCriteria": "성공 기준",
  "summary": "프로젝트 전체 요약 (2-3문장)"
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSON 추출 및 파싱
    const overview = safeParseJSON(text)

    return NextResponse.json({ overview })
  } catch (error: any) {
    console.error('Error generating overview:', error)
    return NextResponse.json(
      { error: error.message || '프로젝트 개요 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
