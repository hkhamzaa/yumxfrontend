'use client'

import Link from 'next/link'

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  void children
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 gap-6">
      <div className="text-center max-w-sm">
        <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-3">
          Admin Panel
        </p>
        <h1 className="font-display font-black text-4xl text-brand-text uppercase mb-4">
          Under<br /><span className="text-brand-accent">Development</span>
        </h1>
        <p className="font-body text-sm text-brand-muted leading-relaxed mb-8">
          The admin dashboard is temporarily unavailable while we work on the backend.
          It will be back soon.
        </p>
        <Link
          href="/"
          className="font-body font-semibold text-sm px-8 py-4 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white transition-colors"
        >
          Back to Site
        </Link>
      </div>
    </div>
  )
}
