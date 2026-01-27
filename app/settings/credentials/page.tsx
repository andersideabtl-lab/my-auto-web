import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CredentialsManager from '@/components/CredentialsManager'
import { isAdmin } from '@/lib/auth-helpers'

export default async function CredentialsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 관리자만 접근 가능 (실시간 권한 확인)
  console.log(`[CREDENTIALS] Checking admin access for user: ${user.email}`)
  const admin = await isAdmin()
  console.log(`[CREDENTIALS] Admin check result: ${admin}`)
  
  if (!admin) {
    console.log(`[CREDENTIALS] Access denied - redirecting to dashboard`)
    redirect('/dashboard')
  }
  
  console.log(`[CREDENTIALS] Access granted for admin user`)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* 뒤로가기 링크 */}
          <div className="mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              대시보드로 돌아가기
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              API 키 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              외부 서비스 API 키를 안전하게 관리하세요
            </p>
          </div>

          <CredentialsManager />
        </div>
      </div>
    </div>
  )
}
