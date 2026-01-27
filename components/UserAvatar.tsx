'use client'

interface UserAvatarProps {
  email: string
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export default function UserAvatar({
  email,
  size = 'md',
  showTooltip = false,
}: UserAvatarProps) {
  // 이메일에서 이니셜 추출
  const getInitials = (email: string): string => {
    const name = email.split('@')[0]
    if (name.length >= 2) {
      return name.substring(0, 2).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  // 이메일 해시로 색상 인덱스 생성
  const getColorIndex = (email: string): number => {
    let hash = 0
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % 8
  }

  const initials = getInitials(email)
  const colorIndex = getColorIndex(email)
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  // 파스텔 색상 클래스 (인덱스 기반)
  const colorClasses = [
    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  ]

  return (
    <div className="relative group">
      <div
        className={`${sizeClasses[size]} rounded-full ${colorClasses[colorIndex]} flex items-center justify-center font-semibold`}
      >
        {initials}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {email}
        </div>
      )}
    </div>
  )
}
