'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UnderDevelopmentDialog } from '@/components/ui/UnderDevelopmentDialog'

function LoginForm() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)

  function setField(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function openMaintenance() {
    setMaintenanceOpen(true)
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="block text-center mb-8">
          <span className="font-display font-black text-3xl tracking-widest text-brand-text">
            YUM <span className="text-brand-accent">X</span>
          </span>
        </Link>

        {/* Mode toggle */}
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-1 flex mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl font-body text-sm font-semibold transition-all ${
              mode === 'login'
                ? 'bg-brand-accent text-brand-bg'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 rounded-xl font-body text-sm font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-brand-accent text-brand-bg'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Card */}
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 sm:p-8">

          {/* Google */}
          <button
            type="button"
            onClick={openMaintenance}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-brand-border text-brand-text font-body text-sm font-semibold hover:bg-brand-border transition-colors mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="font-body text-xs text-brand-dim">or with email</span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>

          {/* Form */}
          <form onSubmit={e => { e.preventDefault(); openMaintenance() }} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <div>
                <label className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="Muhammad Ali"
                  autoComplete="name"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
                />
              </div>
            )}

            <div>
              <label className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="ali@example.com"
                autoComplete="email"
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setField('phone', e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  autoComplete="tel"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Password *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={openMaintenance}
                    className="font-body text-xs text-brand-dim hover:text-brand-accent transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
              />
            </div>

            <button
              type="submit"
              className="w-full font-body font-bold text-base py-4 rounded-full bg-brand-accent text-brand-bg hover:bg-white active:scale-[0.98] transition-all min-h-[52px]"
            >
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="font-body text-xs text-brand-dim text-center mt-6">
          <Link href="/" className="hover:text-brand-accent transition-colors">
            ← Back to homepage
          </Link>
        </p>
      </div>

      <UnderDevelopmentDialog
        label="Login / Sign Up"
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
      />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
