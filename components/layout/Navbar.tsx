'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useCartStore, cartTotalItems } from '@/store/cartStore'
import { Home, Utensils, Tag, Image as ImageIcon, Info, Mail, UserCircle } from 'lucide-react'

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Home',    href: '/',          icon: Home      },
  { label: 'Menu',    href: '/menu',       icon: Utensils  },
  { label: 'Deals',   href: '/menu#deals', icon: Tag       },
  { label: 'Gallery', href: '/#gallery',   icon: ImageIcon },
  { label: 'About',   href: '/about',      icon: Info      },
  { label: 'Contact', href: '/#contact',   icon: Mail      },
]

// Hash links are never shown as "active" — only real page routes
function isNavActive(href: string, pathname: string): boolean {
  if (href.includes('#')) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const cartItems = useCartStore((s) => s.items)
  const count = mounted ? cartTotalItems(cartItems) : 0
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(' ')[0]
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    fetch('/api/public/site-content')
      .then(r => r.json())
      .then((res: { success: boolean; data: { whatsapp_number?: string } }) => {
        if (res.success && res.data.whatsapp_number) {
          setWhatsappPhone(res.data.whatsapp_number.replace(/\D/g, ''))
        }
      })
      .catch(() => {})
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.includes('#')) return
    const hash = href.slice(href.indexOf('#'))
    const basePath = href.split('#')[0] || '/'
    if (pathname === basePath) {
      e.preventDefault()
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* ── Top header bar ── */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-brand-bg/95 backdrop-blur-md border-b border-brand-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">

          {/* Logo — far left */}
          <Link
            href="/"
            className="font-display text-2xl md:text-3xl font-bold tracking-widest text-brand-text hover:text-brand-accent transition-colors duration-300 flex-shrink-0"
          >
            YUM <span className="text-brand-accent">X</span>
          </Link>

          {/* Capsule pill nav — centered between logo and right group */}
          <nav
            className="hidden md:flex items-center bg-brand-surface border border-brand-border rounded-full px-2 py-1.5 gap-0.5"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map(({ label, href, icon: Icon }) => {
              const active = isNavActive(href, pathname)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={e => handleNavClick(e, href)}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'flex items-center gap-2 rounded-full px-3 py-2 transition-all duration-300 ease-in-out',
                    active
                      ? 'bg-brand-accent text-brand-bg'
                      : 'text-brand-muted hover:text-brand-text hover:bg-white/5',
                  ].join(' ')}
                >
                  <Icon
                    size={15}
                    strokeWidth={active ? 2.5 : 2}
                    className="flex-shrink-0"
                  />
                  {/* Label only visible for the active page — animates width */}
                  <span
                    className={[
                      'font-body text-[11px] font-bold tracking-wide overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
                      active ? 'max-w-[64px] opacity-100' : 'max-w-0 opacity-0',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* Right group — auth + cart + CTA */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">

            {/* Auth — desktop only */}
            {mounted && (
              session?.user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href="/my-orders"
                    className="font-body text-xs text-brand-muted hover:text-brand-accent transition-colors"
                  >
                    My Orders
                  </Link>
                  <span className="hidden lg:inline font-body text-xs text-brand-dim max-w-[80px] truncate">
                    Hi, {firstName}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="font-body text-xs text-brand-dim hover:text-brand-accent transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:inline-flex font-body text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors"
                >
                  Login
                </Link>
              )
            )}

            {/* Cart icon */}
            <Link
              href="/cart"
              aria-label={`Cart${count > 0 ? `, ${count} items` : ''}`}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-brand-muted hover:text-brand-accent hover:bg-white/5 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {count > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-accent text-brand-bg text-[10px] font-bold font-body rounded-full flex items-center justify-center px-1 leading-none"
                  aria-hidden="true"
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>

            {/* Order Now — squoval 16px radius per spec */}
            <Link
              href="/menu"
              className="hidden md:inline-flex font-body text-sm font-bold px-5 py-2.5 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white hover:text-brand-bg transition-all duration-300 ease-in-out"
            >
              Order Now
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom dock ── */}
      <nav
        className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center bg-brand-surface/95 backdrop-blur-md border border-brand-border rounded-full px-2 py-1.5 gap-0.5 shadow-xl shadow-black/40"
        aria-label="Mobile navigation"
      >
        {NAV_LINKS.filter(l => l.label !== 'Deals').slice(0, 4).map(({ label, href, icon: Icon }) => {
          const active = isNavActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              onClick={e => handleNavClick(e, href)}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex items-center gap-1.5 rounded-full px-3 py-2.5 transition-all duration-300 ease-in-out',
                active
                  ? 'bg-brand-accent text-brand-bg'
                  : 'text-brand-muted hover:text-brand-text',
              ].join(' ')}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
              <span
                className={[
                  'font-body text-[10px] font-bold tracking-wide overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
                  active ? 'max-w-[56px] opacity-100' : 'max-w-0 opacity-0',
                ].join(' ')}
              >
                {label}
              </span>
            </Link>
          )
        })}

        {/* WhatsApp shortcut */}
        <a
          href={
            whatsappPhone
              ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent("Hi! I'd like to place an order.")}`
              : `https://wa.me/?text=${encodeURIComponent("Hi! I'd like to place an order.")}`
          }
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex items-center rounded-full px-3 py-2.5 transition-all duration-300 ease-in-out text-brand-muted hover:text-brand-text"
        >
          <WhatsAppIcon size={18} />
        </a>

        {/* Auth shortcut — links to my-orders or login */}
        {mounted && (
          <Link
            href={session?.user ? '/my-orders' : '/login'}
            aria-label={session?.user ? 'My Orders' : 'Login'}
            className={[
              'flex items-center rounded-full px-3 py-2.5 transition-all duration-300 ease-in-out',
              (pathname === '/my-orders' || pathname === '/login')
                ? 'bg-brand-accent text-brand-bg'
                : 'text-brand-muted hover:text-brand-text',
            ].join(' ')}
          >
            <UserCircle size={18} strokeWidth={2} />
          </Link>
        )}
      </nav>
    </>
  )
}
