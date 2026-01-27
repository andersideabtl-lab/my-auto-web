import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자만 접근 가능 (실시간 권한 확인, 캐싱 없음)
    console.log(`[API] GET /api/credentials - Checking admin access for: ${user.email}`)
    const admin = await isAdmin()
    console.log(`[API] GET /api/credentials - Admin check result: ${admin}`)
    
    if (!admin) {
      console.log(`[API] GET /api/credentials - Access denied`)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log(`[API] GET /api/credentials - Access granted`)

    // 관리자는 모든 공유 API 키 조회
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('is_shared', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // API 키 마스킹
    const maskedData = data?.map((cred) => ({
      ...cred,
      api_key: maskApiKey(cred.api_key),
    }))

    return NextResponse.json(maskedData || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'API 키 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/credentials - Starting...')
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[API] POST /api/credentials - Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자만 접근 가능 (실시간 권한 확인)
    console.log(`[API] POST /api/credentials - Checking admin access for: ${user.email}`)
    const admin = await isAdmin()
    console.log(`[API] POST /api/credentials - Admin check result: ${admin}`)
    
    if (!admin) {
      console.log(`[API] POST /api/credentials - Access denied`)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log(`[API] POST /api/credentials - Access granted`)

    const body = await request.json()
    console.log('[API] POST /api/credentials - Request body:', { 
      service: body.service, 
      service_name: body.service_name,
      has_api_key: !!body.api_key 
    })
    
    const { service, service_name, display_name, management_url, api_key, is_shared } = body

    if (!service || !api_key) {
      console.error('[API] POST /api/credentials - Missing service or api_key')
      return NextResponse.json(
        { error: '서비스와 API 키가 필요합니다.' },
        { status: 400 }
      )
    }

    // 프리셋이 있으면 해당 프리셋의 검증 함수 사용
    let verifyData = { isValid: false, verifiedAt: new Date().toISOString() }
    let usedPreset = false
    
    console.log(`[API] POST /api/credentials - Verifying API key for service: ${service}, service_name: ${service_name}`)
    
    if (service_name && service_name !== 'custom') {
      try {
        const { getPresetById } = await import('@/lib/service-presets')
        const preset = getPresetById(service_name)
        
        if (preset) {
          console.log(`[API] POST /api/credentials - Found preset for ${service_name}, verifying...`)
          usedPreset = true
          try {
            const result = await preset.verify(api_key)
            verifyData = {
              isValid: result.isValid,
              verifiedAt: new Date().toISOString(),
            }
            console.log(`[API] POST /api/credentials - Preset verification result: ${result.isValid}`)
          } catch (error: any) {
            console.error(`[API] POST /api/credentials - Preset verification error:`, error)
            // 프리셋 검증 실패 시에도 저장 가능 (형식만 확인)
            verifyData = {
              isValid: api_key && api_key.length > 5,
              verifiedAt: new Date().toISOString(),
            }
          }
        } else {
          console.warn(`[API] POST /api/credentials - Preset not found for ${service_name}, using custom verification`)
        }
      } catch (importError: any) {
        console.error(`[API] POST /api/credentials - Error importing service-presets:`, importError)
      }
    }
    
    // 프리셋이 없거나 custom인 경우 커스텀 검증 시도
    if (!usedPreset && (!service_name || service_name === 'custom')) {
      console.log(`[API] POST /api/credentials - Using custom verification for ${service}`)
      // 커스텀 서비스는 기본 검증 (실패해도 저장 가능)
      try {
        const verifyResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/credentials/verify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service, api_key }),
          }
        )
        if (verifyResponse.ok) {
          const customVerifyData = await verifyResponse.json()
          verifyData = customVerifyData
          console.log(`[API] POST /api/credentials - Custom verification result: ${customVerifyData.isValid}`)
        } else {
          // 검증 실패해도 저장 가능 (형식만 확인)
          console.warn(`[API] POST /api/credentials - Custom verification failed for ${service}, but allowing save`)
          verifyData = {
            isValid: api_key && api_key.length > 5, // 최소 길이만 확인
            verifiedAt: new Date().toISOString(),
          }
        }
      } catch (verifyError: any) {
        // 검증 API 호출 실패 시에도 저장 가능
        console.warn(`[API] POST /api/credentials - Custom verification error for ${service}:`, verifyError)
        verifyData = {
          isValid: api_key && api_key.length > 5, // 최소 길이만 확인
          verifiedAt: new Date().toISOString(),
        }
      }
    }

    console.log(`[API] POST /api/credentials - Verification complete: isValid=${verifyData.isValid}`)

    // 기존에 같은 서비스의 공유 API 키가 있는지 확인
    const { data: existing, error: existingError } = await supabase
      .from('credentials')
      .select('id')
      .eq('service', service)
      .eq('is_shared', true)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error(`[API] POST /api/credentials - Error checking existing credential:`, existingError)
      return NextResponse.json(
        { error: `기존 API 키 확인 중 오류: ${existingError.message}` },
        { status: 500 }
      )
    }

    console.log(`[API] POST /api/credentials - Existing credential check: ${existing ? 'found' : 'not found'}`)

    let result
    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from('credentials')
        .update({
          api_key,
          service_name: service_name || null,
          display_name: display_name || null,
          management_url: management_url || null,
          is_valid: verifyData.isValid,
          last_verified: verifyData.verifiedAt,
          is_shared: is_shared ?? true, // 기본값: 공유
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error(`[API] POST /api/credentials - Update error:`, error)
        return NextResponse.json(
          { error: `API 키 업데이트 실패: ${error.message}` },
          { status: 500 }
        )
      }

      result = data
      console.log(`[API] POST /api/credentials - Credential updated: ${result.id}`)
    } else {
      // 생성
      console.log(`[API] POST /api/credentials - Creating new credential...`)
      const { data, error } = await supabase
        .from('credentials')
        .insert({
          user_id: user.id,
          service,
          service_name: service_name || null,
          display_name: display_name || null,
          management_url: management_url || null,
          api_key,
          is_valid: verifyData.isValid,
          last_verified: verifyData.verifiedAt,
          is_shared: is_shared ?? true, // 기본값: 공유
        })
        .select()
        .single()

      if (error) {
        console.error(`[API] POST /api/credentials - Insert error:`, error)
        return NextResponse.json(
          { error: `API 키 생성 실패: ${error.message}` },
          { status: 500 }
        )
      }

      result = data
      console.log(`[API] POST /api/credentials - Credential created: ${result.id}`)
    }

    // API 키 마스킹
    const maskedResult = {
      ...result,
      api_key: maskApiKey(result.api_key),
    }
    console.log(`[API] POST /api/credentials - Success`)
    return NextResponse.json(maskedResult)
  } catch (error: any) {
    console.error(`[API] POST /api/credentials - Unexpected error:`, error)
    console.error(`[API] POST /api/credentials - Error stack:`, error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'API 키 저장에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '***'
  return key.substring(0, 7) + '***' + key.substring(key.length - 4)
}
