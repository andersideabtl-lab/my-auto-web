import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth-helpers'
import Link from 'next/link'

export default async function AdminCheckPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 관리자 여부 확인
  const adminStatus = await isAdmin()

  // 관리자 계정 목록 조회 (관리자만 가능)
  let adminUsers: any[] = []
  if (adminStatus) {
    const { data: users } = await supabase
      .from('users')
      .select('id, role, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })

    if (users) {
      // 각 관리자의 이메일 조회
      adminUsers = await Promise.all(
        users.map(async (u) => {
          // 현재 사용자라면 이메일 가져오기
          if (u.id === user.id) {
            return {
              id: u.id,
              email: user.email,
              role: u.role,
              created_at: u.created_at,
              isCurrentUser: true,
            }
          }
          // 다른 사용자는 ID만 표시 (RLS 정책으로 인해 이메일 조회 불가)
          return {
            id: u.id,
            email: null,
            role: u.role,
            created_at: u.created_at,
            isCurrentUser: false,
          }
        })
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
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

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              관리자 계정 확인
            </h1>

            {/* 현재 사용자 상태 */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    현재 로그인한 계정
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {user.email}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      adminStatus
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {adminStatus ? '관리자' : '일반 사용자'}
                  </span>
                </div>
              </div>
            </div>

            {/* 관리자 목록 */}
            {adminStatus ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  관리자 계정 목록
                </h2>
                {adminUsers.length > 0 ? (
                  <div className="space-y-3">
                    {adminUsers.map((admin, index) => (
                      <div
                        key={admin.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                #{index + 1}
                              </span>
                              {admin.isCurrentUser && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded">
                                  현재 사용자
                                </span>
                              )}
                            </div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                              {admin.email || `사용자 ID: ${admin.id.substring(0, 8)}...`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              생성일: {new Date(admin.created_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-sm font-medium">
                            {admin.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    관리자 계정이 없습니다.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  관리자 권한이 필요합니다. 관리자 계정으로 로그인해주세요.
                </p>
              </div>
            )}

            {/* 안내 */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                💡 관리자 설정 방법
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>첫 번째로 가입한 사용자가 자동으로 관리자로 설정됩니다.</li>
                <li>Supabase SQL Editor에서 직접 확인하려면 <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">scripts/check-admin.sql</code> 파일을 참고하세요.</li>
                <li>관리자 권한을 변경하려면 Supabase SQL Editor에서 <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">UPDATE public.users SET role = 'admin' WHERE id = '사용자ID'</code>를 실행하세요.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
