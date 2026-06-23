'use client'

import { UnderDevelopmentDialog } from '@/components/ui/UnderDevelopmentDialog'

const linkClass =
  'font-body text-sm text-brand-muted hover:text-brand-accent transition-colors text-left w-full'

export function FooterLegalLinks() {
  return (
    <>
      <li>
        <UnderDevelopmentDialog label="Privacy Policy" triggerClassName={linkClass}>
          Privacy Policy
        </UnderDevelopmentDialog>
      </li>
      <li>
        <UnderDevelopmentDialog label="Terms of Service" triggerClassName={linkClass}>
          Terms of Service
        </UnderDevelopmentDialog>
      </li>
    </>
  )
}
