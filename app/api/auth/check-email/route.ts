import { isEmailAllowed } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    const allowed = isEmailAllowed(email)

    return NextResponse.json({ allowed })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '이메일 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
