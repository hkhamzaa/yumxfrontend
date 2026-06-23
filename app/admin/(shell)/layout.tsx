'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [adminEmail, setAdminEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((json) => {
        if (!json.success || !json.data?.email) throw new Error('Unauthorized')
        setAdminEmail(json.data.email)
      })
      .catch(() => router.replace('/admin/login'))
  }, [router])

  if (!adminEmail) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="font-body text-brand-muted">Loading admin…</p>
      </div>
    )
  }

  return (
    <AdminShell adminEmail={adminEmail}>
      {children}
    </AdminShell>
  )
}
