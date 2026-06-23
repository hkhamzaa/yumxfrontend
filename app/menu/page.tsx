'use client'

import { CSSProperties, useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { useCartStore, cartTotalItems } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import type { MenuData, MenuItem, MenuVariant, MenuCategory, ComboDeal } from '@/types/menu'

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonCategoryCard() {
  return (
    <div className="flex-none w-[180px] h-[220px] rounded-[18px] bg-brand-surface border border-brand-border animate-pulse" />
  )
}

function SkeletonCard() {
  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden animate-pulse">
      <div className="h-44 bg-brand-border" />
      <div className="p-4 space-y-2.5">
        <div className="h-5 bg-brand-border rounded w-3/4" />
        <div className="h-3.5 bg-brand-border rounded w-full" />
        <div className="h-3.5 bg-brand-border rounded w-2/3" />
        <div className="flex justify-between items-center mt-4">
          <div className="h-6 bg-brand-border rounded w-24" />
          <div className="h-10 w-10 bg-brand-border rounded-full" />
        </div>
      </div>
    </div>
  )
}

function SkeletonComboCard() {
  return (
    <div className="flex-none w-72 snap-start bg-brand-surface rounded-2xl border border-brand-border overflow-hidden animate-pulse">
      <div className="h-40 bg-brand-border" />
      <div className="p-4 space-y-2.5">
        <div className="h-5 bg-brand-border rounded w-3/4" />
        <div className="h-3.5 bg-brand-border rounded w-full" />
        <div className="flex justify-between mt-3">
          <div className="h-7 bg-brand-border rounded w-24" />
          <div className="h-9 bg-brand-border rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}

// ─── Category Display Map ─────────────────────────────────────────────────────
// Single source of truth for colored display names — used in carousel cards AND section headings

const CATEGORY_DISPLAY_MAP: Record<string, { segments: { text: string; color: 'white' | 'orange' }[] }> = {
  'Burgers (Chicken)':  { segments: [{ text: 'Chicken ', color: 'white' }, { text: 'Burgers', color: 'orange' }] },
  'Burgers (Beef)':     { segments: [{ text: 'Beef ', color: 'white' }, { text: 'Burgers', color: 'orange' }] },
  'Shawarma & Platters':{ segments: [{ text: 'Shawarma ', color: 'white' }, { text: '& ', color: 'orange' }, { text: 'Platters', color: 'white' }] },
  'Zinger Strips':      { segments: [{ text: 'Zinger ', color: 'orange' }, { text: 'Strips', color: 'white' }] },
  'Hot Wings':          { segments: [{ text: 'Hot ', color: 'orange' }, { text: 'Wings', color: 'white' }] },
  'Nuggets':            { segments: [{ text: 'Nuggets', color: 'white' }] },
  'Salted Fries':       { segments: [{ text: 'Salted Fries', color: 'white' }] },
  'Deep Pan Pizza':     { segments: [{ text: 'Deep Pan ', color: 'orange' }, { text: 'Pizza', color: 'white' }] },
  'Fried Chicken':      { segments: [{ text: 'Fried ', color: 'orange' }, { text: 'Chicken', color: 'white' }] },
  'Loaded Fries':       { segments: [{ text: 'Loaded ', color: 'orange' }, { text: 'Fries', color: 'white' }] },
  'Drinks':             { segments: [{ text: 'Drinks', color: 'white' }] },
  'Wraps':              { segments: [{ text: 'Wraps', color: 'white' }] },
}

// ─── Shared card visual ───────────────────────────────────────────────────────

function CategoryCardVisual({ cat }: { cat: MenuCategory }) {
  const entry = CATEGORY_DISPLAY_MAP[cat.name]
  const segments = entry?.segments ?? [{ text: cat.name, color: 'white' as const }]
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: '#111111', borderRadius: '18px', overflow: 'hidden' }}>
      {/* Top strip — dark area, holds category name, height = card height - 200px */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center"
        style={{ bottom: '200px', paddingLeft: '16px', backgroundColor: '#111111', zIndex: 2 }}
      >
        <span
          className="font-display font-extrabold leading-snug"
          style={{ fontSize: '1.1rem', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
        >
          {segments.map((seg, i) => (
            <span key={i} style={{ color: seg.color === 'orange' ? '#F59E0B' : '#FFFFFF' }}>
              {seg.text}
            </span>
          ))}
        </span>
      </div>

      {/* Image — pinned to bottom, fixed 200px, never stretches */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '200px', borderRadius: '0 0 18px 18px', overflow: 'hidden' }}
      >
        {cat.displayImageUrl ? (
          <Image
            src={cat.displayImageUrl}
            alt={cat.name}
            fill
            sizes="280px"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 select-none" style={{ backgroundColor: '#0A0A0A' }}>
            🍽️
          </div>
        )}
        {/* Gradient over image: dark at top edge, transparent at bottom */}
        <div
          className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 60%)' }}
        />

        {/* Starting price badge */}
        {cat.startingPrice !== null && (
          <div
            className="absolute z-[4]"
            style={{
              bottom: '12px',
              left: '12px',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              color: '#F59E0B',
              fontWeight: 600,
            }}
          >
            from Rs. {Math.round(cat.startingPrice)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Category Heading Renderer ────────────────────────────────────────────────

function CategoryHeadingSegments({ name }: { name: string }) {
  const entry = CATEGORY_DISPLAY_MAP[name]
  const segments = entry?.segments ?? [{ text: name, color: 'white' as const }]
  return (
    <>
      {segments.map((seg, i) => (
        <span key={i} style={{ color: seg.color === 'orange' ? '#F59E0B' : '#FFFFFF' }}>
          {seg.text}
        </span>
      ))}
    </>
  )
}

// ─── Category Cards (3-card fan carousel, all screen sizes) ──────────────────

interface CategoryCardsProps {
  categories: MenuCategory[]
  activeSlug: string
  onSelect: (slug: string) => void
}

function CategoryCards({ categories, activeSlug, onSelect }: CategoryCardsProps) {
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [cardW, setCardW] = useState(240)
  const [cardH, setCardH] = useState(280)
  const pausedUntil = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const suppressClick = useRef(false)

  // Responsive card sizing
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768
      setCardW(mobile ? 240 : 280)
      setCardH(mobile ? 280 : 320)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Keep carousel in sync when user scrolls into a category section
  useEffect(() => {
    const i = categories.findIndex((c) => c.slug === activeSlug)
    if (i >= 0) setCarouselIdx(i)
  }, [activeSlug, categories])

  // Auto-advance every 3.5s; paused for 5s after any manual interaction
  useEffect(() => {
    if (categories.length <= 1) return
    const t = setInterval(() => {
      if (Date.now() > pausedUntil.current) {
        setCarouselIdx((p) => (p + 1) % categories.length)
      }
    }, 3500)
    return () => clearInterval(t)
  }, [categories.length])

  const pause = useCallback(() => { pausedUntil.current = Date.now() + 5000 }, [])
  const goPrev = useCallback(() => {
    pause()
    setCarouselIdx((p) => (p - 1 + categories.length) % categories.length)
  }, [pause, categories.length])
  const goNext = useCallback(() => {
    pause()
    setCarouselIdx((p) => (p + 1) % categories.length)
  }, [pause, categories.length])

  // Touch + mouse drag: swipe > 50px advances carousel; < 50px treated as tap
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startX = 0
    el.style.cursor = 'grab'

    const onDown = (cx: number) => { startX = cx; el.style.cursor = 'grabbing' }
    const onUp = (cx: number) => {
      const dx = cx - startX
      if (Math.abs(dx) > 50) {
        suppressClick.current = true
        setTimeout(() => { suppressClick.current = false }, 10)
        dx < 0 ? goNext() : goPrev()
      }
      el.style.cursor = 'grab'
    }

    const onMD = (e: MouseEvent) => onDown(e.clientX)
    const onMU = (e: MouseEvent) => onUp(e.clientX)
    let startY = 0
    const onTS = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; el.style.cursor = 'grabbing' }
    const onTM = (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - startX)
      const dy = Math.abs(e.touches[0].clientY - startY)
      if (dx > 8 && dx > dy) e.preventDefault()
    }
    const onTE = (e: TouchEvent) => onUp(e.changedTouches[0].clientX)

    el.addEventListener('mousedown', onMD)
    document.addEventListener('mouseup', onMU)
    el.addEventListener('touchstart', onTS, { passive: true })
    el.addEventListener('touchmove', onTM, { passive: false })
    el.addEventListener('touchend', onTE, { passive: true })
    return () => {
      el.removeEventListener('mousedown', onMD)
      document.removeEventListener('mouseup', onMU)
      el.removeEventListener('touchstart', onTS)
      el.removeEventListener('touchmove', onTM)
      el.removeEventListener('touchend', onTE)
    }
  }, [goNext, goPrev])

  const n = categories.length
  const containerH = cardH + 50

  return (
    <div role="navigation" aria-label="Menu categories" className="overflow-hidden">
      {/* 3D fan carousel — center card faces forward, side cards angled behind */}
      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{
          height: `${containerH}px`,
          perspective: '1000px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {categories.map((cat, i) => {
          const raw = ((i - carouselIdx) % n + n) % n
          const normOffset = raw > n / 2 ? raw - n : raw
          const isActive = normOffset === 0
          const isPrev   = normOffset === -1
          const isNext   = normOffset === 1

          const base: CSSProperties = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${cardW}px`,
            height: `${cardH}px`,
            borderRadius: '18px',
            transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s, filter 0.4s',
          }

          const style: CSSProperties = isActive
            ? {
                ...base,
                zIndex: 3,
                transform: 'translate(-50%, -50%) rotateY(0deg) scale(1)',
                opacity: 1,
                filter: 'brightness(1)',
                border: '1.5px solid rgba(245, 158, 11, 0.75)',
                boxShadow: '0 0 24px rgba(245, 158, 11, 0.35), 0 0 8px rgba(245, 158, 11, 0.2), inset 0 0 12px rgba(245, 158, 11, 0.05)',
              }
            : isPrev
            ? {
                ...base,
                zIndex: 2,
                transform: 'translate(-50%, -50%) translateX(-55%) rotateY(22deg) scale(0.85)',
                opacity: 0.6,
                filter: 'brightness(0.65)',
                border: '1px solid rgba(255,255,255,0.08)',
              }
            : isNext
            ? {
                ...base,
                zIndex: 2,
                transform: 'translate(-50%, -50%) translateX(55%) rotateY(-22deg) scale(0.85)',
                opacity: 0.6,
                filter: 'brightness(0.65)',
                border: '1px solid rgba(255,255,255,0.08)',
              }
            : {
                ...base,
                zIndex: 1,
                transform: 'translate(-50%, -50%) scale(0.7)',
                opacity: 0,
                pointerEvents: 'none',
              }

          return (
            <button
              key={cat.id}
              onClick={() => {
                if (suppressClick.current) return
                if (isActive) onSelect(cat.slug)
                else if (isPrev) goPrev()
                else goNext()
              }}
              aria-current={activeSlug === cat.slug ? 'true' : undefined}
              style={style}
              className={`focus:outline-none${isActive ? ' category-card-active' : ''}`}
            >
              <CategoryCardVisual cat={cat} />
            </button>
          )
        })}

        {/* Subtle arrow buttons — accessible fallback */}
        <button
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-white text-2xl leading-none focus:outline-none"
          style={{ opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          aria-label="Previous category"
        >
          ‹
        </button>
        <button
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-white text-2xl leading-none focus:outline-none"
          style={{ opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          aria-label="Next category"
        >
          ›
        </button>
      </div>
    </div>
  )
}

// ─── Item Detail Modal ────────────────────────────────────────────────────────

interface ItemDetailModalProps {
  item: MenuItem | null
  allCategories: MenuCategory[]
  open: boolean
  onClose: () => void
}

function ItemDetailModal({ item, allCategories, open, onClose }: ItemDetailModalProps) {
  const addItem = useCartStore((s) => s.addItem)
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(item)
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (open && item) {
      setCurrentItem(item)
      setSelectedVariant(item.variants.length === 1 ? item.variants[0] : null)
      setQuantity(1)
      setAdded(false)
    }
  }, [open, item])

  function switchToItem(next: MenuItem) {
    setCurrentItem(next)
    setSelectedVariant(next.variants.length === 1 ? next.variants[0] : null)
    setQuantity(1)
    setAdded(false)
  }

  if (!currentItem) return null

  const recommendations = (
    allCategories.find((c) => c.id === currentItem.categoryId)?.items ?? []
  )
    .filter((i) => i.id !== currentItem.id && i.isAvailable)
    .slice(0, 4)

  const unitPrice = selectedVariant ? Number(selectedVariant.price) : null
  const totalPrice = unitPrice !== null ? unitPrice * quantity : null
  const hasMultipleVariants = currentItem.variants.length > 1

  function handleAddToCart() {
    if (!selectedVariant) return
    addItem({
      cartKey: selectedVariant.id,
      menuItemVariantId: selectedVariant.id,
      comboDealId: null,
      name: currentItem!.name,
      variantLabel: hasMultipleVariants ? selectedVariant.label : null,
      price: Number(selectedVariant.price),
      imageUrl: currentItem!.imageUrl,
      quantity,
    })
    setAdded(true)
    setTimeout(onClose, 750)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      {/*
       * Layout: flex-col + overflow-hidden on the outer shell so the image
       * header never scrolls away. The body scrolls independently (flex-1
       * min-h-0 overflow-y-auto). The footer stays pinned at the bottom.
       * max-h-[92dvh] comes from the base dialog.tsx — no need to repeat it.
       */}
      <DialogContent
        showDragHandle={false}
        className="p-0 flex flex-col overflow-hidden md:max-w-lg"
      >
        {/* ── Fixed image header (never scrolls) ─────────────────────────── */}
        <div className="relative h-56 sm:h-64 flex-none rounded-t-2xl overflow-hidden bg-brand-border">
          {currentItem.imageUrl ? (
            <Image
              src={currentItem.imageUrl}
              alt={currentItem.name}
              fill
              sizes="(max-width: 768px) 100vw, 512px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl">🍔</div>
          )}

          {/* Drag handle overlaid on image (mobile only) */}
          <div
            className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/50"
            aria-hidden="true"
          />

          {/* Close button — always visible above scroll */}
          <DialogClose asChild>
            <button
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10 text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </DialogClose>

          {currentItem.isFeatured && (
            <span className="absolute top-3 left-3 font-body text-[10px] font-bold tracking-widest uppercase text-brand-bg bg-brand-accent px-2.5 py-1 rounded-full">
              Featured
            </span>
          )}
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        {/*
         * flex-1 min-h-0 is the critical pair: flex-1 fills remaining height,
         * min-h-0 overrides the default min-height:auto so the element can
         * actually shrink and let overflow-y-auto kick in.
         */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 pb-2">
          {/* Name */}
          <DialogTitle className="font-display font-black text-2xl text-brand-text mb-1 leading-tight">
            {currentItem.name}
          </DialogTitle>

          {/* Description */}
          {currentItem.description && (
            <p className="font-body text-sm text-brand-muted leading-relaxed mb-5">
              {currentItem.description}
            </p>
          )}

          {/* Variant selector (multi-variant items only) */}
          {hasMultipleVariants && (
            <div className="mb-5">
              <p className="font-body text-xs tracking-widest text-brand-accent uppercase font-semibold mb-3">
                Choose Size
              </p>
              <div className="flex flex-wrap gap-2">
                {currentItem.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 min-h-[44px] ${
                      selectedVariant?.id === v.id
                        ? 'border-brand-accent bg-brand-accent/10 text-brand-text'
                        : 'border-brand-border text-brand-muted hover:border-brand-accent/50 hover:text-brand-text'
                    }`}
                  >
                    <span className="font-body font-semibold">{v.label}</span>
                    <span className="font-display font-bold text-brand-accent">
                      {formatPrice(v.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-2 mb-1">
              <p className="font-body text-xs tracking-widest text-brand-accent uppercase font-semibold mb-3">
                You Might Also Like
              </p>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
                {recommendations.map((rec) => {
                  const recMinPrice = rec.variants.length
                    ? Math.min(...rec.variants.map((v) => Number(v.price)))
                    : null
                  return (
                    <button
                      key={rec.id}
                      onClick={() => switchToItem(rec)}
                      className="flex-none w-[88px] text-left group"
                    >
                      <div className="relative h-[72px] w-[88px] rounded-xl overflow-hidden bg-brand-border mb-1.5">
                        {rec.imageUrl ? (
                          <Image
                            src={rec.imageUrl}
                            alt={rec.name}
                            fill
                            sizes="88px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl">🍔</div>
                        )}
                      </div>
                      <p className="font-body text-[11px] font-semibold text-brand-text line-clamp-2 leading-tight">
                        {rec.name}
                      </p>
                      {recMinPrice !== null && (
                        <p className="font-body text-[11px] text-brand-accent font-bold mt-0.5">
                          {formatPrice(recMinPrice)}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky footer: quantity + price + Add to Cart ───────────────── */}
        {/* flex-none keeps this pinned regardless of body scroll position */}
        <div className="flex-none px-5 pt-4 pb-5 bg-brand-surface border-t border-brand-border/40">
          {/* Quantity stepper + live price */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-text text-xl font-bold hover:border-brand-accent transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="font-display font-bold text-xl text-brand-text w-7 text-center tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-text text-xl font-bold hover:border-brand-accent transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {totalPrice !== null && (
              <span className="font-display font-black text-2xl text-brand-accent tabular-nums">
                {formatPrice(totalPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || added}
            className={`w-full font-body font-bold text-base py-4 rounded-full transition-all duration-200 min-h-[56px] ${
              added
                ? 'bg-green-600 text-white'
                : selectedVariant
                ? 'bg-brand-accent text-brand-bg hover:bg-white active:scale-[0.98]'
                : 'bg-brand-surface-high border border-brand-border text-brand-dim cursor-not-allowed'
            }`}
          >
            {added
              ? '✓ Added to Cart!'
              : hasMultipleVariants && !selectedVariant
              ? 'Select a Size'
              : 'Add to Cart'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Menu Item Card ───────────────────────────────────────────────────────────

interface MenuItemCardProps {
  item: MenuItem
  onDetail: (item: MenuItem) => void
}

function MenuItemCard({ item, onDetail }: MenuItemCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const [feedback, setFeedback] = useState(false)

  const minPrice = item.variants.length
    ? Math.min(...item.variants.map((v) => Number(v.price)))
    : null

  function handlePlusClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (item.variants.length > 1) {
      onDetail(item)
      return
    }
    const v = item.variants[0]
    if (!v) return
    addItem({
      cartKey: v.id,
      menuItemVariantId: v.id,
      comboDealId: null,
      name: item.name,
      variantLabel: null,
      price: Number(v.price),
      imageUrl: item.imageUrl,
    })
    setFeedback(true)
    setTimeout(() => setFeedback(false), 1200)
  }

  return (
    <article
      onClick={() => onDetail(item)}
      className="group flex flex-col bg-brand-surface rounded-2xl border border-brand-border overflow-hidden hover:border-brand-accent/40 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-brand-accent/8"
    >
      {/* Image */}
      <div className="relative h-44 sm:h-48 overflow-hidden bg-brand-border flex-none">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">🍔</div>
        )}
        {item.isFeatured && (
          <span className="absolute top-2.5 left-2.5 font-body text-[10px] font-bold tracking-widest uppercase text-brand-bg bg-brand-accent px-2.5 py-1 rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Info */}
      <div className="relative flex flex-col flex-1 p-4 pb-4">
        <h3 className="font-display font-bold text-lg leading-tight text-brand-text mb-1 pr-12">
          {item.name}
        </h3>

        {item.description && (
          <p className="font-body text-xs text-brand-muted leading-relaxed line-clamp-2 flex-1 pr-10">
            {item.description}
          </p>
        )}

        {/* Price */}
        <div className="mt-3 pr-12">
          {minPrice !== null && (
            <span className="font-display font-bold text-xl text-brand-accent whitespace-nowrap">
              {item.variants.length > 1 ? 'From ' : ''}
              {formatPrice(minPrice)}
            </span>
          )}
        </div>

        {/* Circular + button (absolute bottom-right) */}
        <button
          onClick={handlePlusClick}
          className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold leading-none transition-all duration-200 shadow-md ${
            feedback
              ? 'bg-green-600 text-white shadow-green-600/30'
              : 'bg-brand-accent text-brand-bg hover:bg-white active:scale-90 shadow-brand-accent/30'
          }`}
          aria-label={`Add ${item.name} to cart`}
        >
          {feedback ? '✓' : '+'}
        </button>
      </div>
    </article>
  )
}

// ─── Combo Deal Card ──────────────────────────────────────────────────────────

function ComboCard({ deal }: { deal: ComboDeal }) {
  const addItem = useCartStore((s) => s.addItem)
  const [feedback, setFeedback] = useState(false)

  function handleAdd() {
    addItem({
      cartKey: deal.id,
      menuItemVariantId: null,
      comboDealId: deal.id,
      name: deal.title,
      variantLabel: `Deal ${deal.dealNumber}`,
      price: Number(deal.price),
      imageUrl: deal.imageUrl,
    })
    setFeedback(true)
    setTimeout(() => setFeedback(false), 1200)
  }

  return (
    <article className="flex-none w-[280px] sm:w-80 bg-brand-surface rounded-2xl border border-brand-border overflow-hidden group hover:border-brand-accent/40 transition-all duration-200">
      <div className="relative h-40 bg-brand-border overflow-hidden">
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
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-surface to-brand-border">
            <span className="font-display font-black text-6xl text-brand-border select-none">
              {deal.dealNumber}
            </span>
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 bg-brand-accent text-brand-bg font-display font-bold text-xs tracking-wide px-2.5 py-1 rounded-full uppercase">
          Deal {deal.dealNumber}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display font-bold text-lg text-brand-text leading-tight mb-1">
          {deal.title}
        </h3>
        {deal.description && (
          <p className="font-body text-xs text-brand-muted leading-relaxed line-clamp-2 mb-3">
            {deal.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-display font-black text-xl text-brand-accent">
            {formatPrice(deal.price)}
          </span>
          <button
            onClick={handleAdd}
            className={`font-body text-sm font-semibold px-4 py-2.5 rounded-full transition-all duration-200 min-h-[44px] ${
              feedback
                ? 'bg-green-600 text-white'
                : 'bg-brand-accent text-brand-bg hover:bg-white active:scale-95'
            }`}
            aria-label={`Add ${deal.title} to cart`}
          >
            {feedback ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── Combo Deal Marquee ───────────────────────────────────────────────────────

function ComboDealMarquee({ deals }: { deals: ComboDeal[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const duration = 42

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track || deals.length === 0) return

    track.style.animation = `dealScroll ${duration}s 0s linear infinite`
    container.style.cursor = 'grab'

    let drag: {
      startX: number
      startY: number
      x0: number
      dir: null | 'h' | 'v'
      currentX: number
    } | null = null

    function getX() {
      return new DOMMatrix(getComputedStyle(track as HTMLDivElement).transform).m41
    }

    function halfTrack() {
      return (track as HTMLDivElement).scrollWidth / 2
    }

    function begin(cx: number, cy: number) {
      const x0 = getX()
      ;(track as HTMLDivElement).style.animation = 'none'
      ;(track as HTMLDivElement).style.transform = `translateX(${x0}px)`
      drag = { startX: cx, startY: cy, x0, dir: null, currentX: x0 }
      ;(container as HTMLDivElement).style.cursor = 'grabbing'
    }

    function end() {
      if (!drag) return
      const ht = halfTrack()
      let pos = drag.currentX % ht
      if (pos > 0) pos -= ht
      const delay = ht > 0 ? (pos / ht) * duration : 0
      ;(track as HTMLDivElement).style.transform = ''
      ;(track as HTMLDivElement).style.animation = `dealScroll ${duration}s ${delay}s linear infinite`
      ;(container as HTMLDivElement).style.cursor = 'grab'
      drag = null
    }

    // Mouse handlers — document-level so dragging outside container still works
    const onMD = (e: MouseEvent) => { e.preventDefault(); begin(e.clientX, e.clientY) }
    const onMM = (e: MouseEvent) => {
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (!drag.dir) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) drag.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
        return
      }
      if (drag.dir !== 'h') { end(); return }
      const newX = drag.x0 + dx
      drag.currentX = newX
      ;(track as HTMLDivElement).style.transform = `translateX(${newX}px)`
    }
    const onMU = () => end()

    // Touch handlers
    const onTS = (e: TouchEvent) => begin(e.touches[0].clientX, e.touches[0].clientY)
    const onTM = (e: TouchEvent) => {
      if (!drag) return
      const t = e.touches[0]
      const dx = t.clientX - drag.startX
      const dy = t.clientY - drag.startY
      if (!drag.dir) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) drag.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
        return
      }
      if (drag.dir === 'h') e.preventDefault()
      if (drag.dir !== 'h') { end(); return }
      const newX = drag.x0 + dx
      drag.currentX = newX
      ;(track as HTMLDivElement).style.transform = `translateX(${newX}px)`
    }
    const onTE = () => end()

    container.addEventListener('mousedown', onMD)
    document.addEventListener('mousemove', onMM)
    document.addEventListener('mouseup', onMU)
    container.addEventListener('touchstart', onTS, { passive: true })
    container.addEventListener('touchmove', onTM, { passive: false })
    container.addEventListener('touchend', onTE)

    return () => {
      container.removeEventListener('mousedown', onMD)
      document.removeEventListener('mousemove', onMM)
      document.removeEventListener('mouseup', onMU)
      container.removeEventListener('touchstart', onTS)
      container.removeEventListener('touchmove', onTM)
      container.removeEventListener('touchend', onTE)
    }
  }, [duration, deals.length])

  if (deals.length === 0) return null

  return (
    <div ref={containerRef} className="overflow-hidden select-none" style={{ cursor: 'grab' }}>
      {/* width:max-content ensures translateX(-50%) is relative to full content width, not viewport */}
      <div ref={trackRef} className="flex gap-4 py-2" style={{ willChange: 'transform', width: 'max-content' }}>
        {[...deals, ...deals].map((deal, i) => (
          <ComboCard key={`${deal.id}-${i}`} deal={deal} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeSlug, setActiveSlug] = useState('')
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null)
  const [mounted, setMounted] = useState(false)
  const cartItems = useCartStore((s) => s.items)
  const cartCount = mounted ? cartTotalItems(cartItems) : 0
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Fetch menu
  useEffect(() => {
    fetch('/api/public/menu')
      .then((r) => r.json())
      .then((res: { success: boolean; data: MenuData }) => {
        if (!res.success) throw new Error('Failed to load menu')
        setMenuData(res.data)
        setActiveSlug(res.data.categories[0]?.slug ?? '')
      })
      .catch(() => setError('Could not load menu. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  // Scroll to #deals on load if navigated from hero
  useEffect(() => {
    if (loading || !menuData) return
    if (window.location.hash === '#deals') {
      const el = document.getElementById('deals')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loading, menuData])

  // Intersection observer to track active category while scrolling
  useEffect(() => {
    if (!menuData) return
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) {
          setActiveSlug(visible[0].target.id.replace('cat-', ''))
        }
      },
      { rootMargin: '-180px 0px -55% 0px', threshold: 0 }
    )
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [menuData])

  const scrollToCategory = useCallback((slug: string) => {
    setActiveSlug(slug)
    const el = sectionRefs.current[slug]
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 180
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  // Client-side search filter
  const q = search.toLowerCase().trim()
  const filteredCategories = menuData
    ? menuData.categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              !q ||
              item.name.toLowerCase().includes(q) ||
              (item.description?.toLowerCase().includes(q) ?? false)
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : []

  const filteredCombos = menuData
    ? menuData.combos.filter(
        (d) =>
          !q ||
          d.title.toLowerCase().includes(q) ||
          (d.description?.toLowerCase().includes(q) ?? false)
      )
    : []

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg pt-16 md:pt-20 overflow-x-hidden">

        {/* Page header */}
        <div className="px-4 sm:px-6 py-8 md:py-10 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-1.5">
                Full Menu
              </p>
              <h1 className="font-display font-black text-[clamp(2.5rem,7vw,4.5rem)] text-brand-text uppercase leading-[0.9] tracking-tight">
                What&apos;s<br className="sm:hidden" />{' '}
                <span className="good-word-wrapper" aria-label="GOOD">
                  {['G','O','O','D'].map((letter, i) => (
                    <span
                      key={i}
                      className="good-letter-span"
                      style={{ '--i': i } as React.CSSProperties}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
                <br className="hidden sm:block" />{' '}
                <span className="text-brand-accent">Today</span>
              </h1>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dim pointer-events-none"
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu…"
                className="w-full bg-brand-surface border border-brand-border rounded-full pl-10 pr-4 py-2.5 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[44px]"
                aria-label="Search menu items"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-dim hover:text-brand-muted transition-colors"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category cards */}
        {loading && (
          <div className="border-b border-brand-border">
            <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6 gap-3 py-4 max-w-7xl mx-auto">
              {[1, 2, 3, 4].map((i) => <SkeletonCategoryCard key={i} />)}
            </div>
          </div>
        )}
        {!loading && menuData && (
          <CategoryCards
            categories={menuData.categories}
            activeSlug={activeSlug}
            onSelect={scrollToCategory}
          />
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="px-4 sm:px-6 max-w-7xl mx-auto py-8 space-y-10">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => <SkeletonComboCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 sm:px-6 max-w-7xl mx-auto py-16 text-center">
            <p className="font-body text-brand-muted mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="font-body text-sm font-semibold px-6 py-3 rounded-full bg-brand-accent text-brand-bg hover:bg-white transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Menu content */}
        {!loading && !error && menuData && (
          <div className="pb-20">

            {/* Combo Deals strip */}
            {filteredCombos.length > 0 && !q && (
              <section
                id="deals"
                className="py-8 md:py-10 border-b border-brand-border bg-brand-surface"
                aria-labelledby="combo-deals-heading"
              >
                <div className="px-4 sm:px-6 max-w-7xl mx-auto mb-5">
                  <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-1">
                    Best Value
                  </p>
                  <h2
                    id="combo-deals-heading"
                    className="font-display font-black text-[clamp(1.8rem,4vw,3rem)] text-brand-text uppercase leading-tight"
                  >
                    Combo <span className="text-brand-accent">Deals</span>
                  </h2>
                </div>

                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-brand-surface to-transparent z-10 pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-brand-surface to-transparent z-10 pointer-events-none" />
                  <ComboDealMarquee deals={filteredCombos} />
                </div>
              </section>
            )}

            {/* Category sections */}
            <div className="px-4 sm:px-6 max-w-7xl mx-auto">
              {filteredCategories.length === 0 && q && (
                <div className="py-20 text-center">
                  <p className="font-display font-bold text-3xl text-brand-text mb-2">
                    No results for &ldquo;{search}&rdquo;
                  </p>
                  <p className="font-body text-brand-muted mb-6">Try a different search term.</p>
                  <button
                    onClick={() => setSearch('')}
                    className="font-body text-sm font-semibold px-6 py-3 rounded-full border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {filteredCategories.map((cat) => (
                <section
                  key={cat.id}
                  id={`cat-${cat.slug}`}
                  ref={(el) => { sectionRefs.current[cat.slug] = el }}
                  className="pt-10 pb-2"
                  aria-labelledby={`heading-${cat.slug}`}
                  style={{ scrollMarginTop: '180px' }}
                >
                  <h2
                    id={`heading-${cat.slug}`}
                    className="font-display font-black text-[clamp(1.8rem,4vw,3rem)] uppercase leading-tight mb-6"
                  >
                    <CategoryHeadingSegments name={cat.name} />
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {cat.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onDetail={(it) => setDetailItem(it)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer content={{}} />

      {/* Item detail modal */}
      <ItemDetailModal
        item={detailItem}
        allCategories={menuData?.categories ?? []}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
      />

      {/* Floating cart CTA (mobile) */}
      {mounted && cartCount > 0 && (
        <div className="fixed bottom-24 inset-x-4 z-40 md:hidden">
          <Link
            href="/cart"
            className="flex items-center justify-between w-full bg-brand-accent text-brand-bg font-body font-semibold text-sm px-5 py-4 rounded-2xl shadow-xl shadow-brand-accent/30"
          >
            <span className="flex items-center gap-2">
              <span className="bg-brand-bg/10 text-brand-bg font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
              View Cart
            </span>
            <span>{formatPrice(cartItems.reduce((s, i) => s + i.price * i.quantity, 0))}</span>
          </Link>
        </div>
      )}
    </>
  )
}
