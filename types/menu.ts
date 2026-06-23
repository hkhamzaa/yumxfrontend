export interface MenuVariant {
  id: string
  label: string
  price: string   // Prisma Decimal serialised as string over HTTP
  menuItemId: string
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  isAvailable: boolean
  isFeatured: boolean
  categoryId: string
  variants: MenuVariant[]
}

export interface MenuCategory {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  displayImageUrl: string | null
  startingPrice: number | null
  displayOrder: number
  isActive: boolean
  items: MenuItem[]
}

export interface ComboDeal {
  id: string
  dealNumber: string
  title: string
  description: string | null
  imageUrl: string | null
  price: string   // Prisma Decimal serialised as string over HTTP
  isActive: boolean
  displayOrder: number
}

export interface MenuData {
  categories: MenuCategory[]
  combos: ComboDeal[]
}
