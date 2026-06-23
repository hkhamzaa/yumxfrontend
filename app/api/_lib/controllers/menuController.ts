import { prisma } from '@/lib/prisma'

function serverLog(ctx: string, e: unknown) {
  console.error(`[menuController] ${ctx}:`, e)
}

export const menuController = {
  /** Full menu payload for the menu page — categories + items + variants + active deals */
  async getFullMenu() {
    try {
      const [categories, combos] = await Promise.all([
        prisma.menuCategory.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { name: 'asc' },
              include: {
                variants: { orderBy: { price: 'asc' } },
              },
            },
          },
        }),
        prisma.comboDeal.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        }),
      ])
      const categoriesWithImage = categories.map((cat) => {
        const allPrices = cat.items.flatMap((item) => item.variants.map((v) => Number(v.price)))
        const startingPrice = allPrices.length > 0 ? Math.min(...allPrices) : null
        return {
          ...cat,
          displayImageUrl: cat.imageUrl ?? cat.items.find((item) => item.imageUrl !== null)?.imageUrl ?? null,
          startingPrice,
        }
      })
      // Wraps fallback: borrow Shawarma & Platters first-item image when wraps has no image
      const wrapsIdx = categoriesWithImage.findIndex((c) => c.slug === 'wraps')
      if (wrapsIdx !== -1 && !categoriesWithImage[wrapsIdx].displayImageUrl) {
        const shawarmaImg = categoriesWithImage.find((c) => c.name.toLowerCase().includes('shawarma'))?.displayImageUrl ?? null
        if (shawarmaImg) categoriesWithImage[wrapsIdx] = { ...categoriesWithImage[wrapsIdx], displayImageUrl: shawarmaImg }
      }
      return { status: 200, data: { success: true, data: { categories: categoriesWithImage, combos } } }
    } catch (e) {
      serverLog('getFullMenu', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  /** Lightweight category list for navigation (no items) */
  async getCategories() {
    try {
      const categories = await prisma.menuCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        select: { id: true, name: true, slug: true, imageUrl: true, displayOrder: true },
      })
      return { status: 200, data: { success: true, data: categories } }
    } catch (e) {
      serverLog('getCategories', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },
}
