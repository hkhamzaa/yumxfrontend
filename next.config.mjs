/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'utfs.io' },
      // Wildcard for any external image host (dev convenience — tighten for production)
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 828, 1080, 1280, 1920],
    imageSizes: [16, 32, 64, 128, 256, 384],
  },
}

export default nextConfig

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
