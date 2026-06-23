'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { UnderDevelopmentDialog } from './UnderDevelopmentDialog'

interface Props {
  label?: string
}

export function MaintenancePageView({ label }: Props) {
  const [open, setOpen] = useState(false)

  // Auto-open the dialog once the component mounts
  useEffect(() => {
    setOpen(true)
  }, [])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 gap-6">
        <Link
          href="/"
          className="font-body text-sm text-brand-muted hover:text-brand-accent transition-colors"
        >
          ← Back to Home
        </Link>
      </main>
      <UnderDevelopmentDialog label={label} open={open} onOpenChange={setOpen} />
    </>
  )
}
