'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'

interface GalleryImage {
  id: string
  imageUrl: string
  caption: string | null
  displayOrder: number
}

interface Props {
  images: GalleryImage[]
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  const img = images[index]

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery lightbox"
      onClick={onClose}
    >
      {/* Image container */}
      <div
        className="relative max-w-5xl w-full max-h-[90vh] aspect-video rounded-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <Image
          src={img.imageUrl}
          alt={img.caption ?? `Gallery image ${index + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 80vw"
          className="object-contain"
          priority
        />

        {img.caption && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="font-body text-sm text-brand-text text-center">{img.caption}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Close lightbox"
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-brand-surface/80 text-brand-text hover:bg-brand-accent hover:text-brand-bg transition-colors text-xl"
      >
        ✕
      </button>

      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-brand-surface/80 text-brand-text hover:bg-brand-accent hover:text-brand-bg transition-colors text-lg"
        >
          ←
        </button>
      )}

      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-brand-surface/80 text-brand-text hover:bg-brand-accent hover:text-brand-bg transition-colors text-lg"
        >
          →
        </button>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-body text-xs text-brand-muted">
        {index + 1} / {images.length}
      </div>
    </div>
  )
}

// Masonry-style layout: 3-col grid with alternating heights
const SPAN_PATTERN = [
  'row-span-2', 'row-span-1', 'row-span-1',
  'row-span-1', 'row-span-1', 'row-span-2',
  'row-span-1', 'row-span-2', 'row-span-1',
]

export function GallerySection({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openAt = useCallback((i: number) => setLightboxIndex(i), [])
  const close = useCallback(() => setLightboxIndex(null), [])
  const prev = useCallback(() => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i)), [])
  const next = useCallback(() => setLightboxIndex(i => (i !== null && i < images.length - 1 ? i + 1 : i)), [images.length])

  if (!images.length) return null

  return (
    <section
      id="gallery"
      className="py-20 md:py-28 bg-brand-surface border-y border-brand-border"
      aria-labelledby="gallery-heading"
    >
      <div className="px-4 sm:px-6 max-w-7xl mx-auto mb-10 md:mb-14">
        <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-3">
          Visual Feed
        </p>
        <h2
          id="gallery-heading"
          className="font-display font-black text-[clamp(2.5rem,6vw,5rem)] text-brand-text uppercase leading-[0.9] tracking-tight"
        >
          The<br />
          <span className="text-brand-accent">Gallery</span>
        </h2>
      </div>

      {/* Masonry grid */}
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
          style={{ gridAutoRows: '160px' }}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => openAt(i)}
              className={`relative overflow-hidden rounded-xl bg-brand-border group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                SPAN_PATTERN[i % SPAN_PATTERN.length]
              }`}
              aria-label={img.caption ?? `Gallery image ${i + 1}`}
            >
              <Image
                src={img.imageUrl}
                alt={img.caption ?? `Gallery image ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-brand-bg/0 group-hover:bg-brand-bg/30 transition-colors duration-300" />
              {img.caption && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="font-body text-xs text-brand-text line-clamp-1">{img.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  )
}
