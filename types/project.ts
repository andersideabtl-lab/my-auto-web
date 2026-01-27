export interface Project {
  id: string
  created_at: string
  user_id: string
  name: string
  description: string | null
  status: string
  creator_email?: string | null // 생성자 이메일 (옵션)
}

export interface CreateProjectInput {
  name: string
  description?: string
}
