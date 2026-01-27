import { createClient } from '@/lib/supabase/server'
import { safeParseJSON } from '@/lib/json-utils'
import { NextRequest, NextResponse } from 'next/server'
import { generateDesignPDF } from '@/lib/pdf-generator'

export const maxDuration = 60

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
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
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

    // 프로젝트 데이터 준비
    let overview = null
    let conversationHistory = null
    let finalDecisions = null
    let validationResult = null

    try {
      if (project.description && project.description.trim()) {
        overview = safeParseJSON(project.description, false) || null
      }
      if (project.conversation_history) {
        conversationHistory =
          typeof project.conversation_history === 'string'
            ? safeParseJSON(project.conversation_history, false) || project.conversation_history
            : project.conversation_history
      }
      if (project.final_decisions) {
        finalDecisions =
          typeof project.final_decisions === 'string'
            ? safeParseJSON(project.final_decisions, false) || project.final_decisions
            : project.final_decisions
      }
      if (project.validation_result) {
        validationResult =
          typeof project.validation_result === 'string'
            ? safeParseJSON(project.validation_result, false) || project.validation_result
            : project.validation_result
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError)
    }

    // PDF 생성
    const pdfBlob = await generateDesignPDF({
      name: project.name,
      overview,
      conversationHistory,
      finalDecisions,
      validationResult,
    })

    // Supabase Storage에 업로드
    const fileName = `설계서_${project.name}_${Date.now()}.pdf`
    const filePath = `${projectId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
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
      type: 'design-doc', // 설계서 PDF
      createdAt: new Date().toISOString(),
    }

    let documentFiles = []
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
    console.error('PDF 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || 'PDF 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
