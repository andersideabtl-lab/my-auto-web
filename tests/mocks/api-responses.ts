/**
 * API 응답 모킹 데이터
 * AI 호출을 최소화하기 위한 고정 응답
 */

export const mockDesignAnalyzeResponse = {
  projectType: '쇼핑몰',
  questions: [
    '결제 시스템은 어떻게 구현할 예정인가요?',
    '재고 관리 방식을 선택해주세요.',
    '배송 추적 기능이 필요한가요?',
    '고객 리뷰 시스템을 포함할까요?',
    '관리자 대시보드 기능은 무엇이 필요한가요?',
  ],
  reasoning: '사용자의 답변을 바탕으로 쇼핑몰 프로젝트로 판단했습니다.',
}

export const mockTechStackResponse = {
  options: [
    {
      name: 'Modern Stack',
      stack: {
        frontend: 'Next.js + React',
        backend: 'Node.js + Express',
        database: 'PostgreSQL',
        deployment: 'Vercel',
      },
      pros: ['빠른 개발', '확장성', '모던 기술'],
      cons: ['학습 곡선', '복잡도'],
      reason: '프로젝트 요구사항에 적합한 모던 스택입니다.',
    },
    {
      name: 'Classic Stack',
      stack: {
        frontend: 'React',
        backend: 'Django',
        database: 'PostgreSQL',
        deployment: 'AWS',
      },
      pros: ['안정성', '검증된 기술'],
      cons: ['느린 개발', '제한적 확장성'],
      reason: '안정적인 클래식 스택입니다.',
    },
    {
      name: 'Lightweight Stack',
      stack: {
        frontend: 'Vue.js',
        backend: 'FastAPI',
        database: 'SQLite',
        deployment: 'Render',
      },
      pros: ['가벼움', '빠른 시작'],
      cons: ['제한적 기능', '확장성 부족'],
      reason: '빠르게 시작할 수 있는 경량 스택입니다.',
    },
  ],
}

export const mockRealityCheckResponse = {
  warnings: ['기한이 짧을 수 있습니다.', '기능 범위가 넓습니다.'],
  risks: [
    {
      type: '일정',
      description: '3개월은 짧을 수 있습니다.',
      mitigation: 'Phase를 단계적으로 진행하세요.',
    },
  ],
  phases: [
    {
      name: 'Phase 1: 기본 기능',
      duration: '4주',
      features: ['사용자 인증', '상품 목록', '장바구니'],
      milestones: ['인증 완료', '상품 CRUD 완료'],
    },
    {
      name: 'Phase 2: 결제 시스템',
      duration: '3주',
      features: ['결제 통합', '주문 관리'],
      milestones: ['결제 테스트 완료'],
    },
  ],
  recommendation: 'Phase별로 단계적으로 진행하는 것을 권장합니다.',
}

export const mockFinalOverviewResponse = {
  type: '쇼핑몰',
  goal: '온라인 쇼핑몰 구축',
  targetUsers: '일반 소비자',
  features: ['상품 관리', '장바구니', '결제', '주문 관리'],
  techStack: {
    frontend: 'Next.js + React',
    backend: 'Node.js + Express',
    database: 'PostgreSQL',
    deployment: 'Vercel',
  },
  timeline: '3개월',
  phases: [
    {
      name: 'Phase 1',
      duration: '4주',
      features: ['기본 기능'],
    },
  ],
  risks: ['일정 지연', '기술 스택 복잡도'],
  successCriteria: '사용자가 상품을 구매할 수 있어야 합니다.',
  summary: '모던 스택을 사용한 온라인 쇼핑몰 프로젝트입니다.',
}

export const mockValidationResponse = {
  overallScore: 75,
  issues: ['기한이 짧습니다.', '기능 범위가 넓습니다.'],
  strengths: ['명확한 목표', '적절한 기술 스택'],
  suggestions: ['Phase를 세분화하세요.', '우선순위를 정하세요.'],
  benchmarking: {
    competitors: [
      {
        name: '경쟁사 A',
        similarity: '높음',
        strengths: ['빠른 로딩', '직관적 UI'],
        weaknesses: ['제한적 기능'],
        differentiation: '더 나은 UX',
      },
    ],
    marketPosition: '중간 시장',
    risks: ['경쟁 심화'],
    opportunities: ['니치 시장'],
  },
  uiux: {
    bestPractices: [],
    strengths: ['명확한 네비게이션'],
    improvements: [],
    score: 80,
  },
  feasibility: {
    features: [],
    totalEstimate: '12주',
    criticalPath: ['인증', '결제'],
    bottlenecks: ['결제 통합'],
    realistic: true,
    warnings: [],
  },
  techStack: {
    currentStack: {
      pros: ['모던 기술', '확장성'],
      cons: ['학습 곡선'],
      suitability: '적합',
    },
    alternatives: [],
    recommendations: [],
    concerns: [],
  },
  timestamp: new Date().toISOString(),
}

export const mockProjectsResponse = [
  {
    id: '1',
    name: '테스트 프로젝트 1',
    description: null,
    status: 'active',
    created_at: '2026-01-26T10:00:00Z',
    user_id: 'user-1',
  },
  {
    id: '2',
    name: '테스트 프로젝트 2',
    description: JSON.stringify(mockFinalOverviewResponse),
    status: 'active',
    created_at: '2026-01-26T11:00:00Z',
    user_id: 'user-1',
  },
]

export const mockPhasesResponse = [
  {
    id: 'phase-1',
    project_id: '1',
    phase_number: 1,
    name: 'Phase 1: 기본 기능',
    duration_weeks: 4,
    status: 'in-progress',
    order: 1,
  },
  {
    id: 'phase-2',
    project_id: '1',
    phase_number: 2,
    name: 'Phase 2: 결제 시스템',
    duration_weeks: 3,
    status: 'pending',
    order: 2,
  },
]

export const mockTasksResponse = [
  {
    id: 'task-1',
    phase_id: 'phase-1',
    name: '사용자 인증 구현',
    type: 'development',
    status: 'done',
    completion_criteria: '로그인/회원가입 완료',
    order: 1,
  },
  {
    id: 'task-2',
    phase_id: 'phase-1',
    name: '상품 목록 구현',
    type: 'development',
    status: 'in-progress',
    completion_criteria: '상품 CRUD 완료',
    order: 2,
  },
]
