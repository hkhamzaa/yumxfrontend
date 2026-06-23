import Link from 'next/link'

export function BrandStory() {
  return (
    <section
      id="about"
      className="py-20 md:py-28 px-4 sm:px-6 max-w-7xl mx-auto"
      aria-labelledby="brand-heading"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Visual side */}
        <div className="relative order-2 lg:order-1">
          <div className="relative h-80 sm:h-96 lg:h-[520px] rounded-2xl overflow-hidden bg-brand-surface border border-brand-border">
            {/* Accent block background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'url(/images/about.jpg) center center / cover no-repeat',
              }}
            />
            {/* Large display number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-display font-black text-[clamp(8rem,20vw,16rem)] leading-none text-brand-border select-none pointer-events-none"
                aria-hidden="true"
              >
                X
              </span>
            </div>

            {/* Stats overlay */}
            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3">
              {[
                { value: '2019', label: 'Est.' },
                { value: '50+', label: 'Menu Items' },
                { value: '★ 4.8', label: 'Rating' },
              ].map(s => (
                <div
                  key={s.label}
                  className="bg-brand-bg/80 backdrop-blur-sm rounded-xl p-3 border border-brand-border text-center"
                >
                  <div className="font-display font-black text-xl text-brand-accent">{s.value}</div>
                  <div className="font-body text-[10px] text-brand-muted mt-0.5 tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative accent block */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 -z-10" />
        </div>

        {/* Text side */}
        <div className="order-1 lg:order-2">
          <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-4">
            Our Story
          </p>
          <h2
            id="brand-heading"
            className="font-display font-black text-[clamp(2.5rem,5vw,4.5rem)] text-brand-text uppercase leading-[0.9] tracking-tight mb-6"
          >
            Born in<br />
            <span className="text-brand-accent">Lahore.</span><br />
            Built for You.
          </h2>

          <div className="space-y-4 font-body text-brand-muted leading-relaxed text-base sm:text-lg">
            <p>
              YUM X started with one obsession: food that&apos;s actually good. Not fast-food
              compromise — real flavour, real ingredients, served at real speed.
            </p>
            <p>
              We built our menu around what Lahore loves: bold, unapologetic taste.
              Smashed burgers. Loaded fries. Combos that make sense. Nothing watered down.
            </p>
            <p className="text-brand-text font-medium">
              Every bite is crafted with the same energy Lahore brings to everything it does.
            </p>
          </div>

          <Link
            href="/about"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-brand-accent hover:text-brand-text transition-colors duration-300 mt-8 group"
          >
            Discover Our Story
            <span
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
