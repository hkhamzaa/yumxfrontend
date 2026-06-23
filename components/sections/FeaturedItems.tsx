'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface Variant {
  id: string
  label: string
  price: string | number
}

interface FeaturedItem {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  variants: Variant[]
  category: { name: string }
}

interface Props {
  items: FeaturedItem[]
}

function minPriceOf(variants: Variant[]): number | null {
  if (!variants.length) return null
  return Math.min(...variants.map(v => Number(v.price)))
}

/** Full-bleed image panel with text overlay at bottom — used in the asymmetric grid */
function ImagePanel({
  item,
  size = 'large',
}: {
  item: FeaturedItem
  size?: 'large' | 'small'
}) {
  const price = minPriceOf(item.variants)

  return (
    <Link
      href="/menu"
      className={[
        'group relative block rounded-2xl overflow-hidden bg-brand-surface border border-brand-border',
        'hover:border-brand-accent/40 transition-colors duration-300',
        size === 'large' ? 'h-[420px] sm:h-[500px] lg:h-full' : 'h-[200px] sm:h-[240px] lg:h-full',
      ].join(' ')}
      aria-label={`View ${item.name}`}
    >
      {/* Background image or gradient placeholder */}
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes={
            size === 'large'
              ? '(max-width: 1024px) 100vw, 60vw'
              : '(max-width: 1024px) 100vw, 40vw'
          }
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, rgba(245,158,11,0.18) 0%, transparent 65%),
                         linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <span className="font-display font-black text-[clamp(6rem,20vw,14rem)] text-brand-accent leading-none select-none">
              {item.name.charAt(0)}
            </span>
          </div>
        </div>
      )}

      {/* Bottom gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Hover amber scrim */}
      <div className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/8 transition-colors duration-300" />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
        <p className="label-caps text-white/50 mb-1">{item.category.name}</p>
        <h3
          className={[
            'font-display font-bold text-white leading-tight',
            size === 'large' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
          ].join(' ')}
        >
          {item.name}
        </h3>
        {price !== null && (
          <p
            className={[
              'font-display font-bold text-brand-accent mt-1',
              size === 'large' ? 'text-xl' : 'text-lg',
            ].join(' ')}
          >
            {formatPrice(price)}
          </p>
        )}
      </div>

      {/* Hover CTA */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="font-body text-xs font-bold px-3 py-1.5 rounded-full bg-brand-accent text-brand-bg">
          Order →
        </span>
      </div>
    </Link>
  )
}

export function FeaturedItems({ items }: Props) {
  if (!items.length) return null

  const [featured, ...rest] = items
  const stackedItems = rest.slice(0, 2)

  return (
    <section
      id="menu"
      className="py-20 md:py-28 px-4 sm:px-6 max-w-7xl mx-auto"
      aria-labelledby="featured-heading"
    >
      {/* Section header — title left, "View Full Menu" button right */}
      <div className="flex items-end justify-between mb-10 md:mb-12 gap-4">
        <div>
          <p className="label-caps text-brand-accent mb-3">Fan Favourites</p>
          <h2
            id="featured-heading"
            className="font-display font-black text-[clamp(2.5rem,6vw,5rem)] text-brand-text uppercase leading-[0.9] tracking-tight"
          >
            Signature<br />
            <span className="text-brand-accent">Collections</span>
          </h2>
        </div>
        <Link
          href="/menu"
          className="flex-none font-body text-sm font-semibold px-5 py-2.5 rounded-full border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-colors hidden sm:inline-flex items-center gap-1.5 self-end mb-1"
        >
          View Full Menu →
        </Link>
      </div>

      {/* Asymmetric image grid — 1 large left + 2 stacked right */}
      {stackedItems.length >= 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 md:gap-5 lg:h-[540px]">
          {/* Large featured item */}
          <ImagePanel item={featured} size="large" />

          {/* Two stacked smaller items */}
          <div className="grid grid-rows-1 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-4 md:gap-5">
            {stackedItems.map(item => (
              <ImagePanel key={item.id} item={item} size="small" />
            ))}
          </div>
        </div>
      ) : (
        /* Fallback: single item full width */
        <div className="h-[480px]">
          <ImagePanel item={featured} size="large" />
        </div>
      )}

      {/* Mobile-only "View Full Menu" link */}
      <div className="mt-8 text-center sm:hidden">
        <Link
          href="/menu"
          className="font-body text-sm font-semibold px-8 py-4 rounded-full border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-colors inline-block"
        >
          View Full Menu →
        </Link>
      </div>
    </section>
  )
}
