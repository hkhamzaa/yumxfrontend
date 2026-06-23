'use client'

import { useState } from 'react'
import { DAY_NAMES, formatTime } from '@/lib/utils'
import { UnderDevelopmentDialog } from '@/components/ui/UnderDevelopmentDialog'

interface Schedule {
  id: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

interface SiteContent {
  address?: string
  phone?: string
  whatsapp_number?: string
  email?: string
  instagram_url?: string
  facebook_url?: string
  [key: string]: string | undefined
}

interface Props {
  schedule: Schedule[]
  content: SiteContent
}

// ── Contact Form (client island) ─────────────────────────────────────────────

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMaintenanceOpen(true)
  }

  const inputClass = "w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
  const labelClass = "font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5"

  return (
    <>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className={labelClass}>Your Name *</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Muhammad Ali" autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="ali@example.com" autoComplete="email" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Message *</label>
          <textarea value={form.message} onChange={e => set('message', e.target.value)}
            placeholder="Your message…" rows={4}
            className={`${inputClass} min-h-[120px] resize-none`} />
        </div>
        <button type="submit"
          className="w-full font-body font-bold text-base py-4 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white active:scale-[0.98] transition-all">
          Send Message
        </button>
      </form>

      <UnderDevelopmentDialog
        label="Contact Us"
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
      />
    </>
  )
}

// ── Main section ─────────────────────────────────────────────────────────────

export function LocationSection({ schedule, content }: Props) {
  const whatsappHref = content.whatsapp_number
    ? `https://wa.me/${content.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent("Hi! I'd like to place an order.")}`
    : null

  return (
    <section
      id="contact"
      className="py-20 md:py-28 bg-brand-surface border-y border-brand-border"
      aria-labelledby="location-heading"
    >
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-3">
          Find Us &amp; Say Hello
        </p>
        <h2
          id="location-heading"
          className="font-display font-black text-[clamp(2.5rem,6vw,5rem)] text-brand-text uppercase leading-[0.9] tracking-tight mb-12 md:mb-16"
        >
          Hours, Location<br />
          <span className="text-brand-accent">&amp; Contact</span>
        </h2>

        {/* Row 1: Hours + Contact info + Order CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 mb-12">

          {/* Hours */}
          {schedule.length > 0 && (
            <div>
              <h3 className="font-display font-bold text-xl text-brand-text mb-4 uppercase tracking-wide">
                Opening Hours
              </h3>
              <ul className="space-y-2">
                {schedule.map(s => (
                  <li key={s.id} className="flex items-center justify-between font-body text-sm">
                    <span className="text-brand-muted w-28">{DAY_NAMES[s.dayOfWeek]}</span>
                    {s.isClosed ? (
                      <span className="text-brand-dim">Closed</span>
                    ) : (
                      <span className="text-brand-text font-medium tabular-nums">
                        {formatTime(s.openTime)} – {formatTime(s.closeTime)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact details */}
          <div>
            <h3 className="font-display font-bold text-xl text-brand-text mb-4 uppercase tracking-wide">
              Get in Touch
            </h3>
            <ul className="space-y-3">
              {content.address && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-brand-accent flex-none" aria-hidden="true">📍</span>
                  <span className="font-body text-sm text-brand-muted leading-relaxed">{content.address}</span>
                </li>
              )}
              {content.phone && (
                <li className="flex items-center gap-3">
                  <span className="text-brand-accent flex-none" aria-hidden="true">📞</span>
                  <a href={`tel:${content.phone}`} className="font-body text-sm text-brand-muted hover:text-brand-accent transition-colors">
                    {content.phone}
                  </a>
                </li>
              )}
              {content.email && (
                <li className="flex items-center gap-3">
                  <span className="text-brand-accent flex-none" aria-hidden="true">✉️</span>
                  <a href={`mailto:${content.email}`} className="font-body text-sm text-brand-muted hover:text-brand-accent transition-colors">
                    {content.email}
                  </a>
                </li>
              )}
              {whatsappHref && (
                <li className="pt-2">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-body text-sm font-semibold text-white bg-[#25D366] px-5 py-3 rounded-full hover:bg-[#1ebe5d] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp Us
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Order CTA */}
          <div className="flex flex-col justify-between bg-brand-bg rounded-2xl border border-brand-border p-6 sm:p-8">
            <div>
              <span className="font-body text-xs tracking-widest text-brand-accent uppercase font-semibold">Ready to Order?</span>
              <h3 className="font-display font-black text-3xl sm:text-4xl text-brand-text uppercase leading-tight mt-2 mb-4">
                Get It<br /><span className="text-brand-accent">Delivered.</span>
              </h3>
              <p className="font-body text-sm text-brand-muted leading-relaxed">
                Delivery in 20–35 minutes within Lahore. Order online or call us directly.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <a href="/menu"
                className="font-body text-sm font-semibold text-center py-3.5 px-6 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white transition-colors">
                Order Online
              </a>
              {content.phone && (
                <a href={`tel:${content.phone}`}
                  className="font-body text-sm font-semibold text-center py-3.5 px-6 rounded-full border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-colors">
                  {content.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Map + Contact form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Google Maps embed */}
          <div>
            <h3 className="font-display font-bold text-xl text-brand-text mb-4 uppercase tracking-wide">Find Us</h3>
            {/* Replace the src URL with the actual embed URL from Google Maps → Share → Embed a map */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-brand-border" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d217396.42290218432!2d74.13297889999999!3d31.4826613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39190483e58107d9%3A0xc23abe9765377ca!2sLahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
                className="absolute inset-0 w-full h-full"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="YUM X Fast Food Location"
              />
            </div>
            {content.address && (
              <p className="font-body text-xs text-brand-dim mt-3 flex items-start gap-2">
                <span className="text-brand-accent mt-0.5 flex-none">📍</span>
                {content.address}
              </p>
            )}
          </div>

          {/* Contact form */}
          <div>
            <h3 className="font-display font-bold text-xl text-brand-text mb-4 uppercase tracking-wide">Send a Message</h3>
            <div className="bg-brand-bg rounded-2xl border border-brand-border p-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
