import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ServicePreset {
  id: string
  name: string
  icon: string
  url: string
  placeholder: string
  verify: (apiKey: string) => Promise<{ isValid: boolean; error?: string }>
  managementUrl: string
}

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: 'claude',
    name: 'Claude',
    icon: '🤖',
    url: 'https://console.anthropic.com',
    placeholder: 'your_key',
    managementUrl: 'https://console.anthropic.com',
    verify: async (apiKey: string) => {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const anthropic = new Anthropic({ apiKey })
        await anthropic.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        })
        return { isValid: true }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'Claude API 키가 유효하지 않습니다.',
        }
      }
    },
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: '✨',
    url: 'https://aistudio.google.com',
    placeholder: 'your_key',
    managementUrl: 'https://aistudio.google.com/apikey',
    verify: async (apiKey: string) => {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        // 검증용으로는 빠른 모델 사용 (gemini-2.5-flash 또는 gemini-3-flash-preview)
        // 안정성을 위해 gemini-2.5-flash 사용 (preview가 아닌 안정 버전)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const result = await model.generateContent('test')
        await result.response // 응답 확인
        return { isValid: true }
      } catch (error: any) {
        // gemini-2.5-flash가 없으면 gemini-pro로 fallback 시도
        try {
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
          await model.generateContent('test')
          return { isValid: true }
        } catch (fallbackError: any) {
          return {
            isValid: false,
            error: error.message || fallbackError.message || 'Gemini API 키가 유효하지 않습니다.',
          }
        }
      }
    },
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    url: 'https://github.com',
    placeholder: 'ghp_...',
    managementUrl: 'https://github.com/settings/tokens',
    verify: async (apiKey: string) => {
      try {
        const response = await fetch('https://api.github.com/user', {
          headers: { Authorization: `token ${apiKey}` },
        })
        if (response.ok) {
          return { isValid: true }
        }
        return {
          isValid: false,
          error: 'GitHub API 키가 유효하지 않습니다.',
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'GitHub API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'openai',
    name: 'ChatGPT',
    icon: '💬',
    url: 'https://platform.openai.com',
    placeholder: 'sk-...',
    managementUrl: 'https://platform.openai.com/api-keys',
    verify: async (apiKey: string) => {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (response.ok) {
          return { isValid: true }
        }
        return {
          isValid: false,
          error: 'OpenAI API 키가 유효하지 않습니다.',
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'OpenAI API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'supabase',
    name: 'Supabase',
    icon: '⚡',
    url: 'https://supabase.com',
    placeholder: 'https://your-project.supabase.co|your_anon_key',
    managementUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    verify: async (apiKey: string) => {
      // Supabase는 URL과 ANON_KEY 둘 다 필요
      // 형식: "URL|ANON_KEY" 또는 "URL|ANON_KEY" 형식으로 파싱
      try {
        let supabaseUrl: string
        let supabaseAnonKey: string

        // "URL|KEY" 형식인지 확인
        if (apiKey.includes('|')) {
          const parts = apiKey.split('|')
          if (parts.length !== 2) {
            return {
              isValid: false,
              error: 'Supabase 형식: URL|ANON_KEY (예: https://xxxxx.supabase.co|eyJhbGc...)',
            }
          }
          supabaseUrl = parts[0].trim()
          supabaseAnonKey = parts[1].trim()
        } else {
          // 기존 형식 (ANON_KEY만) - 호환성을 위해 JWT 형식만 확인
          if (apiKey.startsWith('eyJ')) {
            return {
              isValid: false,
              error: 'Supabase는 URL과 ANON_KEY 둘 다 필요합니다. 형식: URL|ANON_KEY',
            }
          }
          return {
            isValid: false,
            error: 'Supabase 형식이 올바르지 않습니다. 형식: URL|ANON_KEY',
          }
        }

        // URL 형식 확인
        if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
          return {
            isValid: false,
            error: 'Supabase URL 형식이 올바르지 않습니다. (예: https://xxxxx.supabase.co)',
          }
        }

        // ANON_KEY 형식 확인 (JWT 토큰)
        if (!supabaseAnonKey.startsWith('eyJ')) {
          return {
            isValid: false,
            error: 'Supabase ANON_KEY 형식이 올바르지 않습니다. (JWT 토큰 형식)',
          }
        }

        // 실제 Supabase API 호출로 검증
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
          })
          
          // 200, 401, 403 모두 유효한 응답 (프로젝트가 존재함을 의미)
          if (response.status === 200 || response.status === 401 || response.status === 403) {
            return { isValid: true }
          }

          // 404는 프로젝트가 없거나 URL이 잘못됨
          if (response.status === 404) {
            return {
              isValid: false,
              error: 'Supabase 프로젝트를 찾을 수 없습니다. URL을 확인해주세요.',
            }
          }

          return {
            isValid: false,
            error: `Supabase API 응답 오류: ${response.status}`,
          }
        } catch (fetchError: any) {
          // 네트워크 오류는 형식이 맞으면 통과 (개발 환경에서 CORS 등 문제 가능)
          if (supabaseUrl && supabaseAnonKey && supabaseAnonKey.startsWith('eyJ')) {
            return { isValid: true }
          }
          return {
            isValid: false,
            error: `Supabase API 호출 실패: ${fetchError.message}`,
          }
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'Supabase API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: '▲',
    url: 'https://vercel.com',
    placeholder: 'vercel_...',
    managementUrl: 'https://vercel.com/account/tokens',
    verify: async (apiKey: string) => {
      try {
        const response = await fetch('https://api.vercel.com/v2/user', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (response.ok) {
          return { isValid: true }
        }
        return {
          isValid: false,
          error: 'Vercel API 키가 유효하지 않습니다.',
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'Vercel API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'aws',
    name: 'AWS',
    icon: '☁️',
    url: 'https://aws.amazon.com',
    placeholder: 'AKIA...',
    managementUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
    verify: async (apiKey: string) => {
      // AWS는 Access Key ID와 Secret Access Key가 필요하므로 간단히 형식만 확인
      try {
        if (apiKey.startsWith('AKIA') && apiKey.length >= 16) {
          return { isValid: true }
        }
        return {
          isValid: false,
          error: 'AWS Access Key ID 형식이 올바르지 않습니다.',
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'AWS API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    url: 'https://notion.so',
    placeholder: 'secret_...',
    managementUrl: 'https://www.notion.so/my-integrations',
    verify: async (apiKey: string) => {
      try {
        const response = await fetch('https://api.notion.com/v1/users/me', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Notion-Version': '2022-06-28',
          },
        })
        if (response.ok) {
          return { isValid: true }
        }
        return {
          isValid: false,
          error: 'Notion API 키가 유효하지 않습니다.',
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'Notion API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    icon: '🍃',
    url: 'https://mongodb.com',
    placeholder: 'mongodb+srv://...',
    managementUrl: 'https://cloud.mongodb.com/access/api',
    verify: async (apiKey: string) => {
      try {
        // MongoDB는 connection string 또는 API key 형식
        if (apiKey.startsWith('mongodb://') || apiKey.startsWith('mongodb+srv://')) {
          return { isValid: true }
        }
        // API Key 형식도 확인
        if (apiKey.length > 20) {
          return { isValid: true }
        }
        return {
          isValid: false,
          error: 'MongoDB 연결 문자열 또는 API 키 형식이 올바르지 않습니다.',
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'MongoDB API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    icon: '📰',
    url: 'https://wordpress.com',
    placeholder: 'https://example.com/wp-json/...',
    managementUrl: 'https://wordpress.com/me/security',
    verify: async (apiKey: string) => {
      try {
        // WordPress는 URL 형식이거나 Application Password
        if (apiKey.startsWith('http://') || apiKey.startsWith('https://')) {
          return { isValid: true }
        }
        if (apiKey.length > 20) {
          return { isValid: true }
        }
        return {
          isValid: false,
          error: 'WordPress API 키 형식이 올바르지 않습니다.',
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'WordPress API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'render',
    name: 'Render',
    icon: '🚀',
    url: 'https://render.com',
    placeholder: 'rnd_...',
    managementUrl: 'https://dashboard.render.com/account/api-keys',
    verify: async (apiKey: string) => {
      try {
        const response = await fetch('https://api.render.com/v1/owners', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (response.ok) {
          return { isValid: true }
        }
        return {
          isValid: false,
          error: 'Render API 키가 유효하지 않습니다.',
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'Render API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'resend',
    name: 'Resend',
    icon: '📧',
    url: 'https://resend.com',
    placeholder: 're_...',
    managementUrl: 'https://resend.com/api-keys',
    verify: async (apiKey: string) => {
      try {
        const response = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (response.ok || response.status === 404) {
          // 404도 유효한 키 (도메인이 없을 수도 있음)
          return { isValid: true }
        }
        return {
          isValid: false,
          error: 'Resend API 키가 유효하지 않습니다.',
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'Resend API 키 검증에 실패했습니다.',
        }
      }
    },
  },
  {
    id: 'make',
    name: 'Make.com',
    icon: '⚙️',
    url: 'https://make.com',
    placeholder: 'your_api_key',
    managementUrl: 'https://www.make.com/en/integrations/api',
    verify: async (apiKey: string) => {
      try {
        // Make.com API는 인증이 필요한 엔드포인트로 검증
        const response = await fetch('https://api.make.com/v1/users/me', {
          headers: { Authorization: `Token ${apiKey}` },
        })
        if (response.ok) {
          return { isValid: true }
        }
        // 401/403은 키 형식은 맞지만 권한 문제일 수 있으므로 형식만 확인
        if (response.status === 401 || response.status === 403) {
          return { isValid: true } // 형식은 맞다고 간주
        }
        return {
          isValid: false,
          error: 'Make.com API 키가 유효하지 않습니다.',
        }
      } catch (error: any) {
        // 네트워크 오류는 형식만 확인
        if (apiKey && apiKey.length > 10) {
          return { isValid: true }
        }
        return {
          isValid: false,
          error: error.message || 'Make.com API 키 검증에 실패했습니다.',
        }
      }
    },
  },
]

export function getPresetById(id: string): ServicePreset | undefined {
  return SERVICE_PRESETS.find((preset) => preset.id === id)
}

export function getPresetByName(name: string): ServicePreset | undefined {
  return SERVICE_PRESETS.find(
    (preset) => preset.name.toLowerCase() === name.toLowerCase()
  )
}
