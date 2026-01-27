import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id } = body

    if (!project_id) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 프로젝트 소유권 확인
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const results: any = {
      eslint: { success: false, output: '', errors: 0, warnings: 0 },
      typescript: { success: false, output: '', errors: 0 },
      score: 0,
    }

    // ESLint 실행
    try {
      const { stdout, stderr } = await execAsync('npx eslint . --format json', {
        cwd: process.cwd(),
        timeout: 60000,
      })
      const eslintOutput = stderr || stdout
      const errors = (eslintOutput.match(/error/gi) || []).length
      const warnings = (eslintOutput.match(/warning/gi) || []).length

      results.eslint = {
        success: errors === 0,
        output: eslintOutput,
        errors,
        warnings,
      }
    } catch (error: any) {
      results.eslint = {
        success: false,
        output: error.message || error.stdout || error.stderr,
        errors: 0,
        warnings: 0,
      }
    }

    // TypeScript 검사
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
        cwd: process.cwd(),
        timeout: 60000,
      })
      const tsOutput = stderr || stdout
      const errors = (tsOutput.match(/error/gi) || []).length

      results.typescript = {
        success: errors === 0,
        output: tsOutput,
        errors,
      }
    } catch (error: any) {
      // TypeScript 오류는 stderr에 출력됨
      const tsOutput = error.stderr || error.stdout || error.message
      const errors = (tsOutput.match(/error/gi) || []).length

      results.typescript = {
        success: errors === 0,
        output: tsOutput,
        errors,
      }
    }

    // 점수 계산 (100점 만점)
    let score = 100
    if (results.eslint.errors > 0) score -= results.eslint.errors * 5
    if (results.eslint.warnings > 0) score -= results.eslint.warnings * 2
    if (results.typescript.errors > 0) score -= results.typescript.errors * 10
    score = Math.max(0, score)

    results.score = score

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('감리 실행 오류:', error)
    return NextResponse.json(
      { error: error.message || '감리 실행에 실패했습니다.' },
      { status: 500 }
    )
  }
}
