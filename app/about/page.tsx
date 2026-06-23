import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const VALUES = [
  {
    icon: '🔥',
    title: 'No Shortcuts',
    body: 'Every patty is fresh-pressed, every sauce made in-house. We don\'t reheat. We don\'t compromise. We restart the grill if we have to.',
  },
  {
    icon: '⚡',
    title: 'Speed Without Sacrifice',
    body: 'Fast food shouldn\'t mean low-quality food. We\'ve engineered our kitchen flow so you wait less without tasting less.',
  },
  {
    icon: '🏙️',
    title: 'Built for Lahore',
    body: 'Our flavour profile isn\'t imported — it\'s tuned to the palate that grew up on seekh kabab and karahi. Bold, smoky, unapologetic.',
  },
  {
    icon: '🌿',
    title: 'Real Ingredients',
    body: 'No mystery powders. No flavour enhancers hiding in plain sight. What you read on our menu is exactly what goes into your box.',
  },
]

const STATS = [
  { value: '2019', label: 'Founded' },
  { value: '12+', label: 'Menu Items' },
  { value: '50K+', label: 'Orders Served' },
  { value: '★ 4.8', label: 'Average Rating' },
]

const TIMELINE = [
  {
    year: '2019',
    title: 'The Spark',
    body: 'YUM X opened its first counter in Lahore — a small kitchen, a bold menu, and a vision that fast food could actually taste like food.',
  },
  {
    year: '2021',
    title: 'Going Online',
    body: 'We launched delivery and quickly realised Lahore had an appetite that extended well beyond our counter. Orders tripled in three months.',
  },
  {
    year: '2023',
    title: 'The Menu Evolved',
    body: 'Smashed burgers. Loaded fries. Combo Deals that make sense. We stopped copying international trends and started setting our own.',
  },
  {
    year: 'Now',
    title: 'Built on Trust',
    body: 'Thousands of repeat customers, a staff that cares, and a kitchen that never cuts corners. That\'s what YUM X is today.',
  },
]

export const metadata = {
  title: 'About — YUM X Fast Food',
  description: 'The story behind YUM X Fast Food — born in Lahore, built for bold flavour.',
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-brand-bg min-h-screen pt-16 md:pt-20">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative py-24 md:py-36 px-4 sm:px-6 overflow-hidden">
          {/* Bg radial */}
          <div className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(245,158,11,0.10) 0%, transparent 65%)' }} />

          <div className="max-w-4xl mx-auto relative">
            <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-5">
              Our Story
            </p>
            <h1 className="font-display font-black text-[clamp(3rem,10vw,7rem)] text-brand-text uppercase leading-[0.88] tracking-tight mb-8">
              Born in<br />
              <span className="text-brand-accent">Lahore.</span><br />
              Built for You.
            </h1>
            <p className="font-body text-lg sm:text-xl text-brand-muted leading-relaxed max-w-2xl">
              YUM X started with one obsession: food that&apos;s actually good. Not fast-food
              compromise — real flavour, real ingredients, served at real speed. We built our
              menu around what Lahore loves: bold, unapologetic taste. Smashed burgers.
              Loaded fries. Combos that make sense.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {['🔥 Fresh Daily', '⚡ 20 Min or Less', '🏆 No Shortcuts'].map(tag => (
                <span key={tag} className="font-body text-sm font-medium px-4 py-2 rounded-full border border-brand-border text-brand-muted">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <section className="border-y border-brand-border bg-brand-surface py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {STATS.map(s => (
                <div key={s.label}>
                  <p className="font-display font-black text-[clamp(2rem,5vw,3.5rem)] text-brand-accent leading-none">
                    {s.value}
                  </p>
                  <p className="font-body text-xs text-brand-muted uppercase tracking-widest mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Our values ───────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 max-w-7xl mx-auto">
          <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-3">
            What Makes Us Different
          </p>
          <h2 className="font-display font-black text-[clamp(2.2rem,5vw,4rem)] text-brand-text uppercase leading-[0.9] tracking-tight mb-12 md:mb-16">
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="bg-brand-surface rounded-2xl border border-brand-border p-7 group hover:border-brand-accent/40 transition-colors">
                <span className="text-4xl mb-4 block">{v.icon}</span>
                <h3 className="font-display font-bold text-xl text-brand-text uppercase tracking-wide mb-3">{v.title}</h3>
                <p className="font-body text-sm text-brand-muted leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeline ─────────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-brand-surface border-y border-brand-border px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-3">
              How We Got Here
            </p>
            <h2 className="font-display font-black text-[clamp(2.2rem,5vw,4rem)] text-brand-text uppercase leading-[0.9] tracking-tight mb-12 md:mb-16">
              The Journey
            </h2>
            <div className="relative pl-8 border-l border-brand-border space-y-12">
              {TIMELINE.map((t, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <span className="absolute -left-[2.1rem] top-1 w-4 h-4 rounded-full bg-brand-accent border-2 border-brand-bg" />
                  <p className="font-display font-black text-brand-accent text-2xl mb-1 leading-none">{t.year}</p>
                  <h3 className="font-display font-bold text-lg text-brand-text uppercase tracking-wide mb-2">{t.title}</h3>
                  <p className="font-body text-sm text-brand-muted leading-relaxed">{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-4">
              Ready to Taste It?
            </p>
            <h2 className="font-display font-black text-[clamp(2.5rem,7vw,5rem)] text-brand-text uppercase leading-[0.9] tracking-tight mb-6">
              Words Only Get<br />
              You So <span className="text-brand-accent">Far.</span>
            </h2>
            <p className="font-body text-brand-muted text-lg mb-10 leading-relaxed">
              The real story is in the food. Order now and judge for yourself.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/menu"
                className="font-body font-bold text-base px-10 py-4 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white transition-colors active:scale-[0.98]">
                See the Menu
              </Link>
              <Link href="/#contact"
                className="font-body font-bold text-base px-10 py-4 rounded-full border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-colors">
                Get in Touch
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer content={{}} />
    </>
  )
}
