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
      className="text-xs border border-gold/40 text-brown-light rounded-md px-3 py-1.5 hover:bg-gold/10 transition-colors"
    >
      로그아웃
    </button>
  )
}
