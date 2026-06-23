import { FooterLegalLinks } from './FooterLegalLinks'

interface SiteContent {
  phone?: string
  whatsapp_number?: string
  instagram_url?: string
  facebook_url?: string
  [key: string]: string | undefined
}

interface Props {
  content: SiteContent
}

export function Footer({ content }: Props) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-brand-bg border-t border-brand-border pt-16 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Main row — brand left, two link columns right */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-12 sm:gap-16 mb-14">

          {/* Brand block */}
          <div>
            <div className="font-display font-black leading-none text-brand-accent mb-4"
                 style={{ fontSize: 'clamp(3.5rem, 8vw, 5.5rem)' }}>
              YUM<br />X
            </div>
            <p className="font-body text-sm text-brand-muted leading-relaxed max-w-xs">
              Bold flavours. Fast service. Real food.<br />
              Lahore&apos;s go-to fast food destination.
            </p>
          </div>

          {/* Two link columns */}
          <div className="flex gap-12 sm:gap-16">

            {/* Connect */}
            <div>
              <h3 className="label-caps text-brand-dim mb-5">Connect</h3>
              <ul className="space-y-3">
                {content.instagram_url && (
                  <li>
                    <a
                      href={content.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm text-brand-muted hover:text-brand-accent transition-colors"
                    >
                      Instagram
                    </a>
                  </li>
                )}
                {content.facebook_url && (
                  <li>
                    <a
                      href={content.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm text-brand-muted hover:text-brand-accent transition-colors"
                    >
                      Facebook
                    </a>
                  </li>
                )}
                {(content.whatsapp_number || content.phone) && (
                  <li>
                    <a
                      href={
                        content.whatsapp_number
                          ? `https://wa.me/${content.whatsapp_number.replace(/\D/g, '')}`
                          : `tel:${content.phone}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm text-brand-muted hover:text-[#25D366] transition-colors"
                    >
                      WhatsApp
                    </a>
                  </li>
                )}
                {content.phone && (
                  <li>
                    <a
                      href={`tel:${content.phone}`}
                      className="font-body text-sm text-brand-muted hover:text-brand-accent transition-colors"
                    >
                      {content.phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="label-caps text-brand-dim mb-5">Legal</h3>
              <ul className="space-y-3">
                <FooterLegalLinks />
                <li>
                  <a href="/menu" className="font-body text-sm text-brand-accent hover:text-brand-text transition-colors font-semibold">
                    Order Now →
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Copyright line */}
        <div className="border-t border-brand-border pt-6">
          <p className="font-body text-xs text-brand-dim">
            &copy; {year} YUM X Fast Food, Lahore. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}
