'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Layers,
  Image, MessageSquare, Settings, Clock, Menu, X, LogOut, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin/orders',        label: 'Orders',         icon: ShoppingBag     },
  { href: '/admin/menu',          label: 'Menu',           icon: UtensilsCrossed },
  { href: '/admin/combo-deals',   label: 'Combo Deals',    icon: Layers          },
  { href: '/admin/gallery',       label: 'Gallery',        icon: Image           },
  { href: '/admin/testimonials',  label: 'Testimonials',   icon: MessageSquare   },
  { href: '/admin/site-content',  label: 'Site Content',   icon: Settings        },
  { href: '/admin/schedule',      label: 'Schedule',       icon: Clock           },
]

interface AdminShellProps {
  adminEmail: string
  children: React.ReactNode
}

export function AdminShell({ adminEmail, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-brand-border">
        <Link href="/admin/dashboard" onClick={onNav}>
          <span className="font-display font-black text-xl tracking-widest text-brand-text">
            YUM <span className="text-brand-accent">X</span>
          </span>
          <span className="block font-body text-[10px] text-brand-dim tracking-widest uppercase mt-0.5">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNav}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm font-medium transition-all duration-150',
              isActive(href)
                ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-surface'
            )}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span>{label}</span>
            {isActive(href) && <ChevronRight size={14} className="ml-auto text-brand-accent/60" />}
          </Link>
        ))}
      </nav>

      {/* Admin user + logout */}
      <div className="px-4 py-4 border-t border-brand-border">
        <p className="font-body text-xs text-brand-dim truncate mb-2">{adminEmail}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 font-body text-sm text-brand-muted hover:text-red-400 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-brand-surface border-r border-brand-border">
        <SidebarContent />
      </aside>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-56 bg-brand-surface border-r border-brand-border transition-transform duration-300',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-3 right-3 text-brand-dim hover:text-brand-text p-1"
        >
          <X size={18} />
        </button>
        <SidebarContent onNav={() => setDrawerOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 bg-brand-surface border-b border-brand-border">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden text-brand-muted hover:text-brand-text p-1"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            {/* Current section name */}
            <span className="font-display font-bold text-base text-brand-text uppercase tracking-wide">
              {NAV.find(n => isActive(n.href))?.label ?? 'Admin'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block font-body text-xs text-brand-dim truncate max-w-[180px]">
              {adminEmail}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 font-body text-xs text-brand-muted hover:text-red-400 transition-colors"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
