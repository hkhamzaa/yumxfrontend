'use client'

import Link from 'next/link'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        <div className="mb-8">
          <Link href="/">
            <span className="font-display font-black text-3xl tracking-widest text-brand-text">
              YUM <span className="text-brand-accent">X</span>
            </span>
          </Link>
          <p className="font-body text-xs text-brand-dim tracking-widest uppercase mt-1">Admin Dashboard</p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
          <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-3">
            Under Development
          </p>
          <h1 className="font-display font-bold text-2xl text-brand-text uppercase mb-4">
            Admin Panel<br />
            <span className="text-brand-accent">Unavailable</span>
          </h1>
          <p className="font-body text-sm text-brand-muted leading-relaxed">
            The admin dashboard is temporarily unavailable while the backend is being set up.
          </p>
        </div>

        <p className="font-body text-xs text-brand-dim text-center mt-6">
          <Link href="/" className="hover:text-brand-accent transition-colors">← Back to site</Link>
        </p>
      </div>
    </div>
  )
}
