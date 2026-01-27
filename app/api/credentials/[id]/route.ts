import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth-helpers'

export async function DELETE(
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

    // 관리자만 삭제 가능 (실시간 권한 확인)
    console.log(`[API] DELETE /api/credentials/${id} - Checking admin access for: ${user.email}`)
    const admin = await isAdmin()
    console.log(`[API] DELETE /api/credentials/${id} - Admin check result: ${admin}`)
    
    if (!admin) {
      console.log(`[API] DELETE /api/credentials/${id} - Access denied`)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log(`[API] DELETE /api/credentials/${id} - Access granted`)

    // 공유 API 키인지 확인
    const { data: credential, error: fetchError } = await supabase
      .from('credentials')
      .select('is_shared')
      .eq('id', id)
      .single()

    if (fetchError || !credential) {
      return NextResponse.json(
        { error: 'API 키를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (!credential.is_shared) {
      return NextResponse.json(
        { error: '공유 API 키만 삭제할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 삭제
    const { error: deleteError } = await supabase
      .from('credentials')
      .delete()
      .eq('id', id)
      .eq('is_shared', true)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'API 키 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // 관리자만 수정 가능 (실시간 권한 확인)
    console.log(`[API] PATCH /api/credentials/${id} - Checking admin access for: ${user.email}`)
    const admin = await isAdmin()
    console.log(`[API] PATCH /api/credentials/${id} - Admin check result: ${admin}`)
    
    if (!admin) {
      console.log(`[API] PATCH /api/credentials/${id} - Access denied`)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log(`[API] PATCH /api/credentials/${id} - Access granted`)

    const body = await request.json()
    const { api_key, display_name, management_url } = body

    // API 키가 없으면 기존 키 유지 (수정 모드에서 키만 변경하지 않는 경우)
    const shouldUpdateKey = api_key && api_key.trim().length > 0

    // 공유 API 키인지 확인
    const { data: credential, error: fetchError } = await supabase
      .from('credentials')
      .select('service, service_name, is_shared')
      .eq('id', id)
      .single()

    if (fetchError || !credential) {
      return NextResponse.json(
        { error: 'API 키를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (!credential.is_shared) {
      return NextResponse.json(
        { error: '공유 API 키만 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 업데이트할 데이터 준비
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // API 키가 제공된 경우에만 검증 및 업데이트
    if (shouldUpdateKey) {
      // 프리셋이 있으면 해당 프리셋의 검증 함수 사용
      let verifyData = { isValid: false, verifiedAt: new Date().toISOString() }
      
      if (credential.service_name && credential.service_name !== 'custom') {
        const { getPresetById } = await import('@/lib/service-presets')
        const preset = getPresetById(credential.service_name)
        
        if (preset) {
          try {
            const result = await preset.verify(api_key.trim())
            verifyData = {
              isValid: result.isValid,
              verifiedAt: new Date().toISOString(),
            }
          } catch (error: any) {
            verifyData = {
              isValid: false,
              verifiedAt: new Date().toISOString(),
            }
          }
        }
      } else {
        // 커스텀 서비스는 기본 검증
        const verifyResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/credentials/verify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service: credential.service, api_key: api_key.trim() }),
          }
        )
        verifyData = await verifyResponse.json()
      }

      updateData.api_key = api_key.trim()
      updateData.is_valid = verifyData.isValid
      updateData.last_verified = verifyData.verifiedAt
    }

    // display_name과 management_url 업데이트 (제공된 경우)
    if (display_name !== undefined) {
      updateData.display_name = display_name
    }
    if (management_url !== undefined) {
      updateData.management_url = management_url
    }

    // 업데이트
    const { data, error: updateError } = await supabase
      .from('credentials')
      .update(updateData)
      .eq('id', id)
      .eq('is_shared', true)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      ...data,
      api_key: maskApiKey(data.api_key),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'API 키 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '***'
  return key.substring(0, 7) + '***' + key.substring(key.length - 4)
}
