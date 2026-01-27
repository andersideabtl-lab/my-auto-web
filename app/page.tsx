import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 로그인된 사용자는 대시보드로, 아니면 로그인 페이지로
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
