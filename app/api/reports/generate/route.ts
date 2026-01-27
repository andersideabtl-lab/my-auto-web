import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/anthropic'
import { safeParseJSON } from '@/lib/json-utils'
import { NextRequest, NextResponse } from 'next/server'
import { generateReportPDF } from '@/lib/pdf-generator'

export const maxDuration = 120

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
    const { projectId, reportType, phaseId } = body

    if (!projectId || !reportType) {
      return NextResponse.json(
        { error: '프로젝트 ID와 리포트 타입이 필요합니다.' },
        { status: 400 }
      )
    }

    // 프로젝트 정보 가져오기
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 프로젝트 데이터 파싱
    let overview = null
    let conversationHistory = null
    let finalDecisions = null
    let validationResult = null

    try {
      if (project.description) {
        overview = safeParseJSON(project.description, false) || null
      }
      if (project.conversation_history) {
        conversationHistory =
          typeof project.conversation_history === 'string'
            ? safeParseJSON(project.conversation_history, false)
            : project.conversation_history
      }
      if (project.final_decisions) {
        finalDecisions =
          typeof project.final_decisions === 'string'
            ? safeParseJSON(project.final_decisions, false)
            : project.final_decisions
      }
      if (project.validation_result) {
        validationResult =
          typeof project.validation_result === 'string'
            ? safeParseJSON(project.validation_result, false)
            : project.validation_result
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError)
    }

    // Claude API로 리포트 내용 생성
    const anthropic = await createAnthropicClient()
    let reportContent = ''

    if (reportType === 'design') {
      // 설계 리포트
      const systemPrompt = `당신은 프로젝트 설계 리포트 작성 전문가입니다. 다음 정보를 바탕으로 상세한 설계 리포트를 마크다운 형식으로 작성해주세요:

구조:
1. 프로젝트 개요
2. 전체 대화 요약
3. 주요 결정사항
4. 검증 결과 전체
5. 기능 목록 상세
6. 위험 요소
7. 다음 단계

마크다운 형식으로 작성하고, 구체적이고 실용적인 내용으로 작성해주세요.`

      const projectInfo = JSON.stringify(
        {
          name: project.name,
          overview,
          conversationHistory,
          finalDecisions,
          validationResult,
        },
        null,
        2
      )

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `다음 프로젝트 정보를 바탕으로 설계 리포트를 작성해주세요:\n\n${projectInfo}`,
          },
        ],
      })

      reportContent = response.content[0].text
    } else if (reportType === 'phase' && phaseId) {
      // Phase 리포트
      const { data: phase, error: phaseError } = await supabase
        .from('phases')
        .select('*, tasks(*)')
        .eq('id', phaseId)
        .single()

      if (phaseError || !phase) {
        return NextResponse.json(
          { error: 'Phase를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      const systemPrompt = `당신은 Phase 진행 리포트 작성 전문가입니다. 다음 정보를 바탕으로 Phase 리포트를 마크다운 형식으로 작성해주세요:

구조:
1. Phase 개요
2. 완료된 Task
3. 이슈 해결
4. 기술적 결정

마크다운 형식으로 작성해주세요.`

      const phaseInfo = JSON.stringify(
        {
          phase,
          projectOverview: overview,
        },
        null,
        2
      )

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `다음 Phase 정보를 바탕으로 리포트를 작성해주세요:\n\n${phaseInfo}`,
          },
        ],
      })

      reportContent = response.content[0].text
    } else if (reportType === 'audit') {
      // 감리 리포트
      if (!validationResult) {
        return NextResponse.json(
          { error: '감리 결과가 없습니다.' },
          { status: 400 }
        )
      }

      const systemPrompt = `당신은 프로젝트 감리 리포트 작성 전문가입니다. 다음 감리 결과를 바탕으로 리포트를 마크다운 형식으로 작성해주세요:

구조:
1. 평가 점수
2. 문제점
3. 개선안

마크다운 형식으로 작성해주세요.`

      const auditInfo = JSON.stringify(validationResult, null, 2)

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `다음 감리 결과를 바탕으로 리포트를 작성해주세요:\n\n${auditInfo}`,
          },
        ],
      })

      reportContent = response.content[0].text
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 리포트 타입입니다.' },
        { status: 400 }
      )
    }

    // 리포트 데이터 준비
    const reportData: any = {
      projectName: project.name,
      reportType,
      content: reportContent,
      overview,
      conversationHistory,
      finalDecisions,
      validationResult,
    }

    if (reportType === 'phase' && phaseId) {
      const { data: phase } = await supabase
        .from('phases')
        .select('*, tasks(*)')
        .eq('id', phaseId)
        .single()
      reportData.phase = phase
    }

    // PDF 생성
    const pdfBlob = await generateReportPDF(reportData)

    // 파일명 생성
    let fileName = ''
    if (reportType === 'design') {
      fileName = `설계리포트_${project.name}_${Date.now()}.pdf`
    } else if (reportType === 'phase') {
      fileName = `Phase리포트_${reportData.phase?.name || 'Phase'}_${Date.now()}.pdf`
    } else if (reportType === 'audit') {
      fileName = `감리리포트_${project.name}_${Date.now()}.pdf`
    }

    const filePath = `${projectId}/${fileName}`

    // Supabase Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from('ai-project-documents')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage 업로드 오류:', uploadError)
      return NextResponse.json(
        { error: 'PDF 업로드에 실패했습니다.' },
        { status: 500 }
      )
    }

    // Public URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from('ai-project-documents').getPublicUrl(filePath)

    // document_files 업데이트
    const documentFile = {
      name: fileName,
      url: publicUrl,
      type: reportType === 'design' ? 'report-design' : reportType === 'phase' ? 'report-phase' : 'report-audit',
      createdAt: new Date().toISOString(),
    }

    let documentFiles: any[] = []
    try {
      if (project.document_files) {
        documentFiles =
          typeof project.document_files === 'string'
            ? JSON.parse(project.document_files)
            : project.document_files
      }
    } catch {
      documentFiles = []
    }

    documentFiles.push(documentFile)

    // 프로젝트 업데이트
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        document_files: JSON.stringify(documentFiles),
      })
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('프로젝트 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: '프로젝트 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      file: documentFile,
      url: publicUrl,
    })
  } catch (error: any) {
    console.error('리포트 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || '리포트 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
