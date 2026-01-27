import { createAnthropicClient } from '@/lib/anthropic'
import { safeParseJSON } from '@/lib/json-utils'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const anthropic = await createAnthropicClient()
    const body = await request.json()
    const { stateContent } = body

    if (!stateContent) {
      return NextResponse.json(
        { error: '프로젝트 상태 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // Claude API로 프로젝트 상태 분석
    const systemPrompt = `당신은 프로젝트 분석 전문가입니다. project-state.md 파일의 내용을 분석하여 다음 정보를 추출하세요:

1. 진행률 계산 (완료/진행/남은 작업)
2. 완료된 작업 목록
3. 진행 중인 작업 목록
4. 남은 작업 목록
5. 다음 작업 추출 (Cursor 작성 내용 기반)
6. 이슈/버그 파악
7. 프로젝트 개요 생성 (프로젝트 이름, 목표, 기술 스택 등)

다음 형식의 JSON으로 응답하세요:
{
  "projectName": "프로젝트 이름",
  "progress": {
    "completed": 10,
    "inProgress": 3,
    "remaining": 5,
    "total": 18
  },
  "progressPercentage": 55,
  "completedTasks": ["완료된 작업 1", "완료된 작업 2"],
  "inProgressTasks": ["진행 중 작업 1"],
  "remainingTasks": ["남은 작업 1", "남은 작업 2"],
  "nextTasks": ["다음 작업 1 (Cursor 제안)", "다음 작업 2"],
  "issues": ["이슈 1", "버그 1"],
  "projectOverview": {
    "goal": "프로젝트 목표",
    "targetUsers": "주 사용자",
    "features": ["기능 1", "기능 2"],
    "techStack": {
      "frontend": "프론트엔드 기술",
      "backend": "백엔드 기술",
      "database": "데이터베이스"
    },
    "timeline": "예상 기간",
    "summary": "프로젝트 전체 요약"
  }
}

JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `다음 project-state.md 내용을 분석해주세요:\n\n${stateContent.substring(0, 100000)}`, // 최대 100KB
        },
      ],
    })

    const text = response.content[0].text
    const analysisResult = safeParseJSON(text)

    // 기본값 설정
    if (!analysisResult.progress) {
      analysisResult.progress = {
        completed: 0,
        inProgress: 0,
        remaining: 0,
        total: 0,
      }
    }

    if (!analysisResult.progressPercentage) {
      const total = analysisResult.progress.total || 1
      const completed = analysisResult.progress.completed || 0
      analysisResult.progressPercentage = Math.round((completed / total) * 100)
    }

    return NextResponse.json(analysisResult)
  } catch (error: any) {
    console.error('프로젝트 상태 분석 오류:', error)
    return NextResponse.json(
      { error: error.message || '프로젝트 상태 분석에 실패했습니다.' },
      { status: 500 }
    )
  }
}
