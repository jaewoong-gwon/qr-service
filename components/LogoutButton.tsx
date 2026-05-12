'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1 text-sm border rounded hover:bg-gray-100 transition-colors"
    >
      로그아웃
    </button>
  )
}
