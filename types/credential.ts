export interface Credential {
  id: string
  user_id: string
  service: string // 프리셋 ID 또는 'custom'
  service_name?: string // 프리셋 ID
  display_name?: string // 표시 이름
  management_url?: string // 관리 URL
  api_key: string
  is_valid: boolean
  is_shared: boolean // 팀 공유 여부
  last_verified: string | null
  updated_at: string
  created_at: string
}

export interface CreateCredentialInput {
  service: string
  service_name?: string
  display_name?: string
  management_url?: string
  api_key: string
}
