'use client'

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

export function HomePageClient() {
  return (
    <LoadingProvider>
      <PageLoader />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedItems items={mockFeaturedItems} />
        <ComboDeals deals={mockCombos} />
        <BrandStory />
        <GallerySection images={mockGallery} />
        <Testimonials testimonials={mockTestimonials} />
        <LocationSection schedule={mockSchedule} content={mockSiteContent} />
      </main>
      <Footer content={mockSiteContent} />
    </LoadingProvider>
  )
}
