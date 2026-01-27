import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { error: '파일 경로가 필요합니다.' },
        { status: 400 }
      )
    }

    // Storage에서 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('ai-project-documents')
      .download(path)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: '파일을 다운로드할 수 없습니다.' },
        { status: 404 }
      )
    }

    // 파일 내용을 텍스트로 반환
    const text = await fileData.text()

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error: any) {
    console.error('Storage download error:', error)
    return NextResponse.json(
      { error: error.message || '파일 다운로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
