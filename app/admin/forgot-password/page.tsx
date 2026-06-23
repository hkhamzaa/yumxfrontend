'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'email' | 'otp'

function AdminForgotPasswordForm() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // ── Step 1: request OTP ───────────────────────────────────────────────────
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = (await res.json()) as { success: boolean }
      if (json.success) {
        setInfo('If that email is registered, a 6-digit code has been sent.')
        setStep('otp')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify OTP + set new password ────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (otp.length !== 6 || !/^\d+$/.test(otp)) { setError('Enter the 6-digit code from your email'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp, newPassword }),
      })
      const json = (await res.json()) as { success: boolean; error?: string }

      if (json.success) {
        router.push('/admin/login?reset=1')
      } else {
        setError(json.error ?? 'Invalid or expired code. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
  const labelClass = "font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5"

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
          <h1 className="font-display font-bold text-xl text-brand-text uppercase mb-1">
            {step === 'email' ? 'Reset Password' : 'Enter Code'}
          </h1>
          <p className="font-body text-xs text-brand-dim mb-5">
            {step === 'email'
              ? 'Enter your admin email and we\'ll send a reset code.'
              : `Enter the 6-digit code sent to ${email} and choose a new password.`}
          </p>

          {/* Progress indicator */}
          <div className="flex gap-2 mb-6">
            {(['email', 'otp'] as const).map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step === s || (i === 0) ? 'bg-brand-accent' : 'bg-brand-border'} ${i === 1 && step === 'email' ? 'bg-brand-border' : ''}`} />
            ))}
          </div>

          {info && step === 'otp' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="font-body text-sm text-green-400">{info}</p>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className={labelClass}>Admin Email</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@yumxfastfood.com" required autoComplete="email"
                  className={inputClass} />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="font-body text-sm text-red-400">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full font-body font-bold text-base py-3.5 rounded-xl bg-brand-accent text-brand-bg hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[50px]">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
              <div>
                <label htmlFor="otp" className={labelClass}>6-Digit Code</label>
                <input id="otp" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456" required autoComplete="one-time-code"
                  className={`${inputClass} text-center text-2xl tracking-[0.4em] font-display font-bold`} />
              </div>

              <div>
                <label htmlFor="new-password" className={labelClass}>New Password</label>
                <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8} autoComplete="new-password"
                  className={inputClass} />
              </div>

              <div>
                <label htmlFor="confirm-password" className={labelClass}>Confirm Password</label>
                <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password" required autoComplete="new-password"
                  className={inputClass} />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="font-body text-sm text-red-400">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full font-body font-bold text-base py-3.5 rounded-xl bg-brand-accent text-brand-bg hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[50px]">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Updating…' : 'Set New Password'}
              </button>

              <button type="button" onClick={() => { setStep('email'); setOtp(''); setNewPassword(''); setConfirmPassword(''); setError(null) }}
                className="w-full font-body text-xs text-brand-dim hover:text-brand-accent transition-colors py-1">
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="font-body text-xs text-brand-dim text-center mt-6">
          <Link href="/admin/login" className="hover:text-brand-accent transition-colors">← Back to login</Link>
        </p>
      </div>
    </div>
  )
}

export default function AdminForgotPasswordPage() {
  return (
    <Suspense>
      <AdminForgotPasswordForm />
    </Suspense>
  )
}
