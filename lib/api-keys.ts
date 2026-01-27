import { createClient } from '@/lib/supabase/server'

/**
 * 서비스 이름을 표준화 (API 키 조회용)
 */
function normalizeServiceName(service: string): string {
  const mapping: Record<string, string> = {
    anthropic: 'anthropic',
    claude: 'anthropic',
    gemini: 'gemini',
    google: 'gemini',
  }
  return mapping[service.toLowerCase()] || service.toLowerCase()
}

/**
 * API 키 가져오기 (개인 키 우선, 없으면 공유 키)
 */
export async function getApiKey(service: string): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // 서비스 이름 정규화
  const normalizedService = normalizeServiceName(service)
  const serviceVariants = [service, normalizedService].filter((s, i, arr) => arr.indexOf(s) === i)

  // 1. 개인 API 키 확인 (우선)
  const { data: personalKeys } = await supabase
    .from('credentials')
    .select('api_key')
    .eq('user_id', user.id)
    .in('service', serviceVariants)
    .eq('is_valid', true)
    .eq('is_shared', false)
    .limit(1)

  if (personalKeys && personalKeys.length > 0 && personalKeys[0]?.api_key) {
    return personalKeys[0].api_key
  }

  // 2. 공유 API 키 확인
  const { data: sharedKeys } = await supabase
    .from('credentials')
    .select('api_key')
    .in('service', serviceVariants)
    .eq('is_valid', true)
    .eq('is_shared', true)
    .limit(1)

  if (sharedKeys && sharedKeys.length > 0 && sharedKeys[0]?.api_key) {
    return sharedKeys[0].api_key
  }

  // 3. 환경 변수 확인 (fallback)
  if (normalizedService === 'anthropic' || service === 'claude') {
    return process.env.ANTHROPIC_API_KEY || null
  }
  if (normalizedService === 'gemini' || service === 'google') {
    return process.env.GEMINI_API_KEY || null
  }

  return null
}
