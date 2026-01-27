export interface Phase {
  id: string
  project_id: string
  phase_number: number
  name: string
  duration_weeks: number
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  order: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  phase_id: string
  name: string
  type: 'development' | 'testing' | 'documentation' | 'deployment' | 'other'
  status: 'todo' | 'in-progress' | 'done' | 'blocked'
  completion_criteria: string | null
  order: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreatePhaseInput {
  project_id: string
  phase_number: number
  name: string
  duration_weeks: number
  order: number
}

export interface CreateTaskInput {
  phase_id: string
  name: string
  type: Task['type']
  completion_criteria?: string
  order: number
}
