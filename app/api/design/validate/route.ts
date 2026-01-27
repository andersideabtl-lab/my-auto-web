import { createAnthropicClient } from '@/lib/anthropic'
import { safeParseJSON } from '@/lib/json-utils'
import { NextRequest } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const anthropic = await createAnthropicClient()
    const body = await request.json()
    const { projectOverview } = body

    if (!projectOverview) {
      return new Response(
        JSON.stringify({ error: '프로젝트 개요가 필요합니다.' }),
        { status: 400 }
      )
    }

    const projectInfo = JSON.stringify(projectOverview, null, 2)

    // 4가지 검증 병렬 실행
    const [benchmarking, uiux, feasibility, techStack] = await Promise.all([
      // 1. 벤치마킹
      anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: `당신은 시장 분석가입니다. 주어진 프로젝트와 유사한 제품 5개를 분석하고 차별점을 평가하세요.

다음 형식의 JSON으로 응답하세요:
{
  "competitors": [
    {
      "name": "경쟁 제품 이름",
      "similarity": "유사도 (높음/중간/낮음)",
      "strengths": ["강점 1", "강점 2"],
      "weaknesses": ["약점 1", "약점 2"],
      "differentiation": "차별화 포인트"
    }
  ],
  "marketPosition": "시장 포지셔닝 분석",
  "risks": ["위험 요소 1", "위험 요소 2"],
  "opportunities": ["기회 1", "기회 2"]
}`,
        messages: [
          {
            role: 'user',
            content: `다음 프로젝트를 분석해주세요:\n\n${projectInfo}`,
          },
        ],
      }),

      // 2. UI/UX 분석
      anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: `당신은 UX 전문가입니다. 업계 모범 사례와 비교하고 개선점을 제안하세요.

다음 형식의 JSON으로 응답하세요:
{
  "bestPractices": [
    {
      "category": "카테고리 (예: 네비게이션, 정보 구조)",
      "current": "현재 설계 상태",
      "recommendation": "모범 사례 제안",
      "priority": "우선순위 (높음/중간/낮음)"
    }
  ],
  "strengths": ["잘된 점 1", "잘된 점 2"],
  "improvements": [
    {
      "issue": "개선이 필요한 부분",
      "suggestion": "개선 제안",
      "impact": "예상 효과"
    }
  ],
  "score": 75
}`,
        messages: [
          {
            role: 'user',
            content: `다음 프로젝트의 UI/UX를 분석해주세요:\n\n${projectInfo}`,
          },
        ],
      }),

      // 3. 실현가능성 분석
      anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: `당신은 프로젝트 매니저입니다. 각 기능의 소요 시간을 추정하고 위험을 평가하세요.

다음 형식의 JSON으로 응답하세요:
{
  "features": [
    {
      "name": "기능 이름",
      "estimatedTime": "예상 소요 시간 (예: 2주)",
      "complexity": "복잡도 (높음/중간/낮음)",
      "dependencies": ["의존성 1", "의존성 2"],
      "risks": ["위험 1", "위험 2"]
    }
  ],
  "totalEstimate": "전체 예상 기간",
  "criticalPath": ["중요 경로 기능들"],
  "bottlenecks": ["병목 지점들"],
  "realistic": true,
  "warnings": ["경고 메시지들"]
}`,
        messages: [
          {
            role: 'user',
            content: `다음 프로젝트의 실현가능성을 분석해주세요:\n\n${projectInfo}`,
          },
        ],
      }),

      // 4. 기술 스택 분석
      anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: `당신은 시니어 아키텍트입니다. 기술 스택의 장단점과 대안을 심층 분석하세요.

다음 형식의 JSON으로 응답하세요:
{
  "currentStack": {
    "pros": ["장점 1", "장점 2"],
    "cons": ["단점 1", "단점 2"],
    "suitability": "적합도 평가"
  },
  "alternatives": [
    {
      "name": "대안 기술 스택",
      "pros": ["장점"],
      "cons": ["단점"],
      "whenToUse": "언제 사용하면 좋은지"
    }
  ],
  "recommendations": ["추천 사항 1", "추천 사항 2"],
  "concerns": ["우려사항 1", "우려사항 2"]
}`,
        messages: [
          {
            role: 'user',
            content: `다음 프로젝트의 기술 스택을 분석해주세요:\n\n${projectInfo}`,
          },
        ],
      }),
    ])

    // 응답 파싱
    const parseResponse = (response: any) => {
      const text = response.content[0].text
      return safeParseJSON(text)
    }

    const benchmarkingResult = parseResponse(benchmarking)
    const uiuxResult = parseResponse(uiux)
    const feasibilityResult = parseResponse(feasibility)
    const techStackResult = parseResponse(techStack)

    // 종합 점수 계산 (각 영역별 가중치)
    const uiuxScore = uiuxResult.score || 70
    const feasibilityScore = feasibilityResult.realistic ? 80 : 50
    const techStackScore = 75 // 기술 스택 적합도 기반 점수 (추후 개선 가능)
    const benchmarkingScore = 70 // 벤치마킹 기반 점수

    const overallScore = Math.round(
      uiuxScore * 0.3 +
        feasibilityScore * 0.3 +
        techStackScore * 0.2 +
        benchmarkingScore * 0.2
    )

    // 문제, 잘된 점, 개선 제안 수집
    const issues: string[] = []
    const strengths: string[] = []
    const suggestions: string[] = []

    // 벤치마킹에서
    if (benchmarkingResult.risks) {
      issues.push(...benchmarkingResult.risks.map((r: string) => `시장: ${r}`))
    }
    if (benchmarkingResult.opportunities) {
      suggestions.push(
        ...benchmarkingResult.opportunities.map((o: string) => `기회: ${o}`)
      )
    }

    // UI/UX에서
    if (uiuxResult.strengths) {
      strengths.push(...uiuxResult.strengths)
    }
    if (uiuxResult.improvements) {
      uiuxResult.improvements.forEach((imp: any) => {
        issues.push(`UI/UX: ${imp.issue}`)
        suggestions.push(`UI/UX: ${imp.suggestion}`)
      })
    }

    // 실현가능성에서
    if (feasibilityResult.warnings) {
      issues.push(...feasibilityResult.warnings.map((w: string) => `실현가능성: ${w}`))
    }
    if (feasibilityResult.bottlenecks) {
      suggestions.push(
        ...feasibilityResult.bottlenecks.map((b: string) => `병목: ${b} 해결 필요`)
      )
    }

    // 기술 스택에서
    if (techStackResult.concerns) {
      issues.push(...techStackResult.concerns.map((c: string) => `기술: ${c}`))
    }
    if (techStackResult.recommendations) {
      suggestions.push(...techStackResult.recommendations)
    }

    const validationResult = {
      overallScore,
      benchmarking: benchmarkingResult,
      uiux: uiuxResult,
      feasibility: feasibilityResult,
      techStack: techStackResult,
      issues,
      strengths,
      suggestions,
      timestamp: new Date().toISOString(),
    }

    return new Response(JSON.stringify(validationResult), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Validation error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || '검증 중 오류가 발생했습니다.',
      }),
      { status: 500 }
    )
  }
}
