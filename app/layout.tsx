import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Manrope } from 'next/font/google'
import './globals.css'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { Providers } from '@/components/Providers'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'YUM X Fast Food — Lahore',
  description: 'Bold flavours. Fast service. Real food. Lahore\'s go-to fast food destination.',
  openGraph: {
    title: 'YUM X Fast Food',
    description: 'Bold flavours. Fast service. Real food.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${manrope.variable}`}>
      <body className="bg-brand-bg text-brand-text font-body antialiased">
        <Providers>
          {children}
        </Providers>
        <WhatsAppButton />
      </body>
    </html>
  )
}
