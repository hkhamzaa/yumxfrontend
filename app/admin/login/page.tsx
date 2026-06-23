'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/admin/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const json = (await res.json()) as { success: boolean; error?: string }

      if (!json.success) {
        setError(json.error ?? 'Login failed. Please try again.')
        return
      }

      router.push(from)
      router.refresh()
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-display font-black text-3xl tracking-widest text-brand-text">
              YUM <span className="text-brand-accent">X</span>
            </span>
          </Link>
          <p className="font-body text-xs text-brand-dim tracking-widest uppercase mt-1">Admin Dashboard</p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <h1 className="font-display font-bold text-xl text-brand-text uppercase mb-5">Sign In</h1>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@yumx.pk"
                required
                autoComplete="email"
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
              />
            </div>

            <div>
              <label htmlFor="password" className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="font-body text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-body font-bold text-base py-3.5 rounded-xl bg-brand-accent text-brand-bg hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[50px]"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <Link href="/admin/forgot-password"
              className="block text-center font-body text-xs text-brand-dim hover:text-brand-accent transition-colors mt-1">
              Forgot password?
            </Link>
          </form>
        </div>

        <p className="font-body text-xs text-brand-dim text-center mt-6">
          <Link href="/" className="hover:text-brand-accent transition-colors">← Back to site</Link>
        </p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  )
}
