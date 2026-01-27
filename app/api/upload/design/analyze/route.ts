import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/anthropic'
import { safeParseJSON } from '@/lib/json-utils'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD] Starting design analysis (no project creation)...')
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[UPLOAD] Unauthorized - no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[UPLOAD] User authenticated: ${user.email}`)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('[UPLOAD] No file provided')
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 }
      )
    }

    console.log(`[UPLOAD] File received: ${file.name}, size: ${file.size}`)

    // 파일 검증
    const allowedExtensions = ['.pdf', '.docx', '.md', '.txt']
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB 이하여야 합니다.' },
        { status: 400 }
      )
    }

    // 파일을 텍스트로 변환
    let fileContent = ''
    if (extension === '.txt' || extension === '.md') {
      const buffer = await file.arrayBuffer()
      const decoder = new TextDecoder('utf-8')
      fileContent = decoder.decode(buffer)
    } else {
      // PDF나 DOCX의 경우, 여기서는 간단히 파일명만 사용
      fileContent = `파일명: ${file.name}\n파일 크기: ${file.size} bytes\n\n이 파일의 내용을 분석해주세요.`
    }

    // Supabase Storage에 업로드
    const fileName = `design_${Date.now()}_${file.name}`
    const filePath = `designs/${user.id}/${fileName}`

    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('ai-project-documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[UPLOAD] Storage upload error:', uploadError)
      
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
        return NextResponse.json(
          { 
            error: 'Storage 버킷이 없습니다. Supabase Dashboard에서 "ai-project-documents" 버킷을 생성해주세요.',
            details: 'Supabase Dashboard > Storage > Create bucket > Name: ai-project-documents > Public bucket 체크'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `파일 업로드에 실패했습니다: ${uploadError.message || '알 수 없는 오류'}` },
        { status: 500 }
      )
    }
    console.log('[UPLOAD] File uploaded to storage:', filePath)

    // Claude API로 설계서 분석
    console.log('[UPLOAD] Creating Anthropic client...')
    let anthropic
    try {
      anthropic = await createAnthropicClient()
      console.log('[UPLOAD] Anthropic client created successfully')
    } catch (anthropicError: any) {
      console.error('[UPLOAD] Anthropic client creation failed:', anthropicError)
      return NextResponse.json(
        { error: anthropicError.message || 'AI 클라이언트 생성에 실패했습니다. API 키를 확인해주세요.' },
        { status: 500 }
      )
    }

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

    console.log('[UPLOAD] Calling Claude API...')
    let response
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `다음 설계서를 분석해주세요:\n\n${fileContent.substring(0, 100000)}`, // 최대 100KB
          },
        ],
      })
      console.log('[UPLOAD] Claude API response received')
    } catch (claudeError: any) {
      console.error('[UPLOAD] Claude API error:', claudeError)
      return NextResponse.json(
        { error: claudeError.message || 'AI 분석에 실패했습니다.' },
        { status: 500 }
      )
    }

    const text = response.content[0].text
    console.log('[UPLOAD] Claude response text length:', text.length)
    
    let projectOverview
    try {
      projectOverview = safeParseJSON(text)
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError)
      projectOverview = {
        goal: '설계서에서 추출된 목표',
        targetUsers: '사용자',
        features: [],
        techStack: {},
        timeline: '미정',
        phases: [],
        risks: [],
        summary: '설계서가 업로드되었습니다.',
      }
    }

    // 파일 URL 생성
    const fileUrl = supabase.storage
      .from('ai-project-documents')
      .getPublicUrl(filePath).data.publicUrl

    console.log(`[UPLOAD] Analysis complete, returning overview`)
    return NextResponse.json({
      success: true,
      overview: projectOverview,
      fileName: file.name,
      fileUrl,
      filePath,
    })
  } catch (error: any) {
    console.error('[UPLOAD] Unexpected error:', error)
    console.error('[UPLOAD] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || '분석 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
