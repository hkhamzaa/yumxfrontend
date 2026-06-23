'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PageLoader } from '@/components/loader/PageLoader'
import { LoadingProvider } from '@/components/loader/LoadingProvider'
import { HeroSection } from '@/components/hero/HeroSection'
import { FeaturedItems } from '@/components/sections/FeaturedItems'
import { ComboDeals } from '@/components/sections/ComboDeals'
import { BrandStory } from '@/components/sections/BrandStory'
import { GallerySection } from '@/components/sections/GallerySection'
import { Testimonials } from '@/components/sections/Testimonials'
import { LocationSection } from '@/components/sections/LocationSection'
import {
  mockCombos,
  mockFeaturedItems,
  mockGallery,
  mockSchedule,
  mockSiteContent,
  mockTestimonials,
} from '@/lib/mock-data'
import type { ComboDeal, MenuItem } from '@/types/menu'

type PageData = {
  featuredItems: Array<MenuItem & { category: { name: string } }>
  combos: ComboDeal[]
  gallery: Array<{ id: string; imageUrl: string; caption: string | null; displayOrder: number }>
  testimonials: Array<{ id: string; customerName: string; rating: number; reviewText: string }>
  schedule: Array<{ id: string; dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>
  siteContent: Record<string, string>
}

const designMode = process.env.NEXT_PUBLIC_DESIGN_MODE === 'true'

async function fetchPageData(): Promise<PageData> {
  if (designMode) {
    return {
      featuredItems: mockFeaturedItems,
      combos: mockCombos,
      gallery: mockGallery,
      testimonials: mockTestimonials,
      schedule: mockSchedule,
      siteContent: mockSiteContent,
    }
  }

  const [menuRes, galleryRes, testimonialsRes, scheduleRes, siteContentRes] = await Promise.all([
    fetch('/api/public/menu'),
    fetch('/api/public/gallery'),
    fetch('/api/public/testimonials'),
    fetch('/api/public/schedule'),
    fetch('/api/public/site-content'),
  ])

  const [menuJson, galleryJson, testimonialsJson, scheduleJson, siteContentJson] = await Promise.all([
    menuRes.json(),
    galleryRes.json(),
    testimonialsRes.json(),
    scheduleRes.json(),
    siteContentRes.json(),
  ])

  if (!menuJson.success) throw new Error('Failed to load menu')

  const featuredItems = (menuJson.data.categories as Array<{
    name: string
    items: Array<MenuItem & { variants: Array<{ price: string | number }> }>
  }>).flatMap((category) =>
    category.items
      .filter((item) => item.isFeatured)
      .map((item) => ({
        ...item,
        category: { name: category.name },
        variants: item.variants.map((variant) => ({
          ...variant,
          price: String(variant.price),
        })),
      }))
  )

  const combos = (menuJson.data.combos as ComboDeal[]).map((deal) => ({
    ...deal,
    price: String(deal.price),
  }))

  return {
    featuredItems,
    combos,
    gallery: galleryJson.success ? galleryJson.data : [],
    testimonials: testimonialsJson.success ? testimonialsJson.data : [],
    schedule: scheduleJson.success ? scheduleJson.data : [],
    siteContent: siteContentJson.success ? siteContentJson.data : {},
  }
}

export function HomePageClient() {
  const [data, setData] = useState<PageData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchPageData()
      .then(setData)
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
        <p className="font-body text-brand-muted text-center">Unable to load page content. Please refresh.</p>
      </div>
    )
  }

  if (!data) {
    return (
      <LoadingProvider>
        <PageLoader />
      </LoadingProvider>
    )
  }

  return (
    <LoadingProvider>
      <PageLoader />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedItems items={data.featuredItems} />
        <ComboDeals deals={data.combos} />
        <BrandStory />
        <GallerySection images={data.gallery} />
        <Testimonials testimonials={data.testimonials} />
        <LocationSection schedule={data.schedule} content={data.siteContent} />
      </main>
      <Footer content={data.siteContent} />
    </LoadingProvider>
  )
}
