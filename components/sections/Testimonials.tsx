'use client'

import { useState } from 'react'

interface Testimonial {
  id: string
  customerName: string
  rating: number
  reviewText: string
}

interface Props {
  testimonials: Testimonial[]
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 justify-center" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill={i < rating ? '#F59E0B' : '#262626'}
          aria-hidden="true"
        >
          <path d="M7 1l1.545 3.13 3.455.502-2.5 2.435.59 3.433L7 8.885l-3.09 1.615.59-3.433L2 4.632l3.455-.502z" />
        </svg>
      ))}
    </div>
  )
}

export function Testimonials({ testimonials }: Props) {
  const [current, setCurrent] = useState(0)

  if (!testimonials.length) return null

  const t = testimonials[current]
  const hasPrev = current > 0
  const hasNext = current < testimonials.length - 1

  return (
    <section
      className="py-24 md:py-36 px-4 sm:px-6"
      aria-labelledby="testimonial-quote"
    >
      <div className="max-w-4xl mx-auto text-center">

        {/* Ornamental quotation mark */}
        <div
          className="font-display italic leading-none text-brand-accent select-none mb-2"
          style={{ fontSize: 'clamp(5rem, 12vw, 9rem)', opacity: 0.25 }}
          aria-hidden="true"
        >
          &ldquo;
        </div>

        {/* Quote text */}
        <blockquote
          id="testimonial-quote"
          className="font-display italic text-[clamp(1.4rem,3.5vw,2.2rem)] text-brand-text leading-[1.45] tracking-tight mb-8"
        >
          {t.reviewText}
        </blockquote>

        {/* Attribution */}
        <div className="flex flex-col items-center gap-3">
          <Stars rating={t.rating} />
          <p className="label-caps text-brand-muted">{t.customerName}</p>
        </div>

        {/* Navigation — dots + arrows, only when multiple testimonials */}
        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setCurrent(c => c - 1)}
              disabled={!hasPrev}
              aria-label="Previous review"
              className="w-9 h-9 rounded-full border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent disabled:opacity-25 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
            >
              ←
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Review ${i + 1}`}
                  className={[
                    'rounded-full transition-all duration-300',
                    i === current
                      ? 'w-6 h-1.5 bg-brand-accent'
                      : 'w-1.5 h-1.5 bg-brand-border hover:bg-brand-muted',
                  ].join(' ')}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrent(c => c + 1)}
              disabled={!hasNext}
              aria-label="Next review"
              className="w-9 h-9 rounded-full border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent disabled:opacity-25 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
            >
              →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
