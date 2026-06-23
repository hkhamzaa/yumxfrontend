import Image from 'next/image'
import { formatPrice } from '@/lib/utils'

interface ComboDeal {
  id: string
  dealNumber: string
  title: string
  description: string | null
  price: string | number
  imageUrl: string | null
  isActive: boolean
}

interface Props {
  deals: ComboDeal[]
}

function DealCard({ deal, index }: { deal: ComboDeal; index: number }) {
  return (
    <article className="flex-none w-72 sm:w-80 snap-start bg-brand-surface rounded-2xl border border-brand-border overflow-hidden hover:border-brand-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-brand-accent/10 group">
      {/* Image */}
      <div className="relative h-44 bg-brand-border overflow-hidden">
        {deal.imageUrl ? (
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            sizes="320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, #161616 0%, #262626 100%)`,
            }}
          >
            <span className="font-display font-black text-7xl text-brand-border leading-none select-none">
              {deal.dealNumber}
            </span>
          </div>
        )}

        {/* Deal badge */}
        <div className="absolute top-3 right-3 bg-brand-accent text-brand-bg font-display font-bold text-xs tracking-widest px-2.5 py-1 rounded-full uppercase">
          Deal {deal.dealNumber}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display font-bold text-xl text-brand-text leading-tight mb-1.5">
          {deal.title}
        </h3>
        {deal.description && (
          <p className="font-body text-sm text-brand-muted leading-relaxed line-clamp-2 mb-4">
            {deal.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-display font-black text-2xl text-brand-accent">
            {formatPrice(deal.price)}
          </span>
          <button
            className="font-body text-sm font-semibold px-4 py-2 rounded-full bg-brand-accent text-brand-bg hover:bg-white transition-colors active:scale-95"
            aria-label={`Order ${deal.title}`}
          >
            Order
          </button>
        </div>
      </div>
    </article>
  )
}

export function ComboDeals({ deals }: Props) {
  if (!deals.length) return null

  return (
    <section
      id="deals"
      className="py-20 md:py-28 bg-brand-surface border-y border-brand-border overflow-hidden"
      aria-labelledby="deals-heading"
    >
      <div className="px-4 sm:px-6 max-w-7xl mx-auto mb-10 md:mb-14">
        <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-3">
          Save More
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h2
            id="deals-heading"
            className="font-display font-black text-[clamp(2.5rem,6vw,5rem)] text-brand-text uppercase leading-[0.9] tracking-tight"
          >
            Combo<br />
            <span className="text-brand-accent">Deals</span>
          </h2>
          <p className="font-body text-sm text-brand-muted max-w-xs sm:text-right pb-1">
            Bundle up and save — built for families, friends, and serious appetites.
          </p>
        </div>
      </div>

      {/* Horizontal scroll strip */}
      <div className="relative">
        {/* Left gradient fade */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-brand-surface to-transparent z-10 pointer-events-none" />
        {/* Right gradient fade */}
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-brand-surface to-transparent z-10 pointer-events-none" />

        <div className="flex gap-5 overflow-x-auto scrollbar-hide px-6 sm:px-10 pb-4 snap-x snap-mandatory">
          {deals.map((deal, i) => (
            <DealCard key={deal.id} deal={deal} index={i} />
          ))}
        </div>
      </div>

      {/* Scroll indicator dots */}
      <div className="flex justify-center gap-1.5 mt-6 px-4">
        {deals.slice(0, 8).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-border" />
        ))}
      </div>
    </section>
  )
}
