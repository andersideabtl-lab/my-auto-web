import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/anthropic'
import { isAdmin } from '@/lib/auth-helpers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자만 검증 가능 (실시간 권한 확인)
    console.log(`[API] POST /api/credentials/${id}/verify - Checking admin access for: ${user.email}`)
    const admin = await isAdmin()
    console.log(`[API] POST /api/credentials/${id}/verify - Admin check result: ${admin}`)
    
    if (!admin) {
      console.log(`[API] POST /api/credentials/${id}/verify - Access denied`)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log(`[API] POST /api/credentials/${id}/verify - Access granted`)

    // 공유 API 키 가져오기 (관리자만)
    const { data: credential, error: fetchError } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', id)
      .eq('is_shared', true)
      .single()

    if (fetchError || !credential) {
      return NextResponse.json(
        { error: 'API 키를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 프리셋이 있으면 해당 프리셋의 검증 함수 사용
    let isValid = false
    let errorMessage = ''

    if (credential.service_name && credential.service_name !== 'custom') {
      const { getPresetById } = await import('@/lib/service-presets')
      const preset = getPresetById(credential.service_name)
      
      if (preset) {
        try {
          const result = await preset.verify(credential.api_key)
          isValid = result.isValid
          errorMessage = result.error || ''
        } catch (error: any) {
          isValid = false
          errorMessage = error.message || 'API 키 검증에 실패했습니다.'
        }
      }
    } else {
      // 커스텀 서비스는 기본 검증
      try {
        switch (credential.service) {
        case 'claude':
          const anthropic = new (await import('@anthropic-ai/sdk')).default({
            apiKey: credential.api_key,
          })
          await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 10,
            messages: [
              {
                role: 'user',
                content: 'test',
              },
            ],
          })
          isValid = true
          break

        case 'gemini':
          const genAI = new GoogleGenerativeAI(credential.api_key)
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
          await model.generateContent('test')
          isValid = true
          break

        case 'github':
          const githubResponse = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `token ${credential.api_key}`,
            },
          })
          if (githubResponse.ok) {
            isValid = true
          } else {
            errorMessage = 'GitHub API 키가 유효하지 않습니다.'
          }
          break

        case 'openai':
          const openaiResponse = await fetch(
            'https://api.openai.com/v1/models',
            {
              headers: {
                Authorization: `Bearer ${credential.api_key}`,
              },
            }
          )
          if (openaiResponse.ok) {
            isValid = true
          } else {
            errorMessage = 'OpenAI API 키가 유효하지 않습니다.'
          }
          break

        default:
          return NextResponse.json(
            { error: '지원하지 않는 서비스입니다.' },
            { status: 400 }
          )
        }
      } catch (error: any) {
        isValid = false
        errorMessage = error.message || 'API 키 검증에 실패했습니다.'
      }
    }

    // 검증 결과 업데이트
    const { error: updateError } = await supabase
      .from('credentials')
      .update({
        is_valid: isValid,
        last_verified: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('is_shared', true)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      isValid,
      error: errorMessage || null,
      verifiedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '검증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
