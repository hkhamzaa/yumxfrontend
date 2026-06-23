'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { UnderDevelopmentDialog } from '@/components/ui/UnderDevelopmentDialog'

function ForgotPasswordForm() {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)

  const inputClass = "w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
  const labelClass = "font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5"

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="block text-center mb-8">
          <span className="font-display font-black text-3xl tracking-widest text-brand-text">
            YUM <span className="text-brand-accent">X</span>
          </span>
        </Link>

        {/* Card */}
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 sm:p-8">
          <h1 className="font-display font-bold text-xl text-brand-text uppercase mb-1">
            {step === 'email' ? 'Forgot Password?' : 'Enter Reset Code'}
          </h1>
          <p className="font-body text-sm text-brand-muted mb-6">
            {step === 'email'
              ? "Enter your account email. If it's registered, we'll send you a code."
              : `Check your inbox at ${email} for a 6-digit code.`}
          </p>

          {/* Progress dots */}
          <div className="flex gap-2 mb-6">
            <div className="h-1 flex-1 rounded-full bg-brand-accent" />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'otp' ? 'bg-brand-accent' : 'bg-brand-border'}`} />
          </div>

          {step === 'email' ? (
            <form onSubmit={e => { e.preventDefault(); setMaintenanceOpen(true) }} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className={labelClass}>Email *</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ali@example.com" autoComplete="email" className={inputClass} />
              </div>

              <button type="submit"
                className="w-full font-body font-bold text-base py-4 rounded-full bg-brand-accent text-brand-bg hover:bg-white active:scale-[0.98] transition-all min-h-[52px]">
                Send Code
              </button>
            </form>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setMaintenanceOpen(true) }} className="space-y-4" noValidate>
              <div>
                <label htmlFor="otp" className={labelClass}>6-Digit Code *</label>
                <input id="otp" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456" autoComplete="one-time-code"
                  className={`${inputClass} text-center text-2xl tracking-[0.4em] font-display font-bold`} />
                <p className="font-body text-xs text-brand-dim mt-1.5">Expires in 10 minutes</p>
              </div>

              <div>
                <label htmlFor="new-password" className={labelClass}>New Password *</label>
                <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters" autoComplete="new-password" className={inputClass} />
              </div>

              <div>
                <label htmlFor="confirm-password" className={labelClass}>Confirm Password *</label>
                <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password" autoComplete="new-password" className={inputClass} />
              </div>

              <button type="submit"
                className="w-full font-body font-bold text-base py-4 rounded-full bg-brand-accent text-brand-bg hover:bg-white active:scale-[0.98] transition-all min-h-[52px]">
                Set New Password
              </button>

              <button type="button"
                onClick={() => { setStep('email'); setOtp(''); setNewPassword(''); setConfirmPassword('') }}
                className="w-full font-body text-xs text-brand-dim hover:text-brand-accent transition-colors py-1">
                ← Try a different email
              </button>
            </form>
          )}
        </div>

        <p className="font-body text-xs text-brand-dim text-center mt-6">
          <Link href="/login" className="hover:text-brand-accent transition-colors">← Back to Sign In</Link>
        </p>
      </div>

      <UnderDevelopmentDialog
        label="Password Reset"
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
      />
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
