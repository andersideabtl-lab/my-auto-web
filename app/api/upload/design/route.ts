import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD] Starting design upload...')
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
    const projectName = formData.get('projectName') as string

    if (!file) {
      console.error('[UPLOAD] No file provided')
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 }
      )
    }

    if (!projectName || !projectName.trim()) {
      return NextResponse.json(
        { error: '프로젝트명이 필요합니다.' },
        { status: 400 }
      )
    }

    console.log(`[UPLOAD] File received: ${file.name}, size: ${file.size}`)

    // 파일 검증
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'text/plain',
    ]
    const allowedExtensions = ['.pdf', '.docx', '.md', '.txt']
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      return NextResponse.json(
        { error: '파일 크기는 10MB 이하여야 합니다.' },
        { status: 400 }
      )
    }

    // 파일 내용은 AnalysisTab에서 분석

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
      
      // 버킷이 없는 경우 명확한 안내 메시지
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

    // 분석은 AnalysisTab에서 수행

    // Public URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from('ai-project-documents').getPublicUrl(filePath)

    // 프로젝트 생성 (분석은 나중에 AnalysisTab에서)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: projectName.trim(),
        description: null, // 나중에 분석 결과로 채워짐
        status: 'active',
        creation_mode: 'doc',
        uploaded_file_path: filePath,
      })
      .select()
      .single()

    if (projectError) {
      console.error('[UPLOAD] Project creation error:', projectError)
      return NextResponse.json(
        { error: `프로젝트 생성에 실패했습니다: ${projectError.message || '알 수 없는 오류'}` },
        { status: 500 }
      )
    }

    // document_files에 업로드 파일 추가
    const documentFiles = [
      {
        name: file.name,
        url: publicUrl,
        type: 'upload',
        createdAt: new Date().toISOString(),
      },
    ]

    await supabase
      .from('projects')
      .update({
        document_files: JSON.stringify(documentFiles),
      })
      .eq('id', project.id)

    console.log(`[UPLOAD] Project created successfully: ${project.id}`)
    console.log(`[UPLOAD] Project details:`, {
      id: project.id,
      name: project.name,
      user_id: project.user_id,
      creation_mode: project.creation_mode,
      status: project.status,
    })
    
    // 생성된 프로젝트를 다시 조회하여 확실히 존재하는지 확인
    // 약간의 지연을 두어 DB 커밋 대기
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const { data: verifiedProject, error: verifyError } = await supabase
      .from('projects')
      .select('id, name, user_id, creation_mode, uploaded_file_path')
      .eq('id', project.id)
      .eq('user_id', user.id)
      .single()
    
    if (verifyError) {
      console.error('[UPLOAD] Failed to verify project creation:', {
        error: verifyError,
        code: verifyError.code,
        message: verifyError.message,
        details: verifyError.details,
        hint: verifyError.hint,
      })
      
      // 프로젝트가 실제로 생성되었는지 확인 (RLS 우회 없이)
      const { data: projectCheck, error: checkError } = await supabase
        .from('projects')
        .select('id, name, user_id')
        .eq('id', project.id)
        .maybeSingle()
      
      if (projectCheck) {
        console.error('[UPLOAD] Project exists but verification failed:', {
          projectUserId: projectCheck.user_id,
          currentUserId: user.id,
          match: projectCheck.user_id === user.id,
        })
      } else {
        console.error('[UPLOAD] Project does not exist in database')
      }
      
      return NextResponse.json(
        { error: '프로젝트 생성 확인에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    if (!verifiedProject) {
      console.error('[UPLOAD] Verified project is null')
      return NextResponse.json(
        { error: '프로젝트 생성 확인에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    console.log(`[UPLOAD] Project verified successfully: ${verifiedProject.id}`)
    
    return NextResponse.json({
      id: verifiedProject.id,
      name: verifiedProject.name,
    })
  } catch (error: any) {
    console.error('[UPLOAD] Unexpected error:', error)
    console.error('[UPLOAD] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || '업로드 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
