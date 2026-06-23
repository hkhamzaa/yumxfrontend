import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  /** Unique key in cart — equals menuItemVariantId or comboDealId */
  cartKey: string
  menuItemVariantId: string | null
  comboDealId: string | null
  name: string
  variantLabel: string | null
  price: number
  imageUrl: string | null
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (cartKey: string) => void
  updateQuantity: (cartKey: string, qty: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (payload) =>
        set((state) => {
          const existing = state.items.find((i) => i.cartKey === payload.cartKey)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartKey === payload.cartKey
                  ? { ...i, quantity: i.quantity + (payload.quantity ?? 1) }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { ...payload, quantity: payload.quantity ?? 1 }],
          }
        }),

      removeItem: (cartKey) =>
        set((state) => ({ items: state.items.filter((i) => i.cartKey !== cartKey) })),

      updateQuantity: (cartKey, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.cartKey !== cartKey)
              : state.items.map((i) => (i.cartKey === cartKey ? { ...i, quantity: qty } : i)),
        })),

      clearCart: () => set({ items: [] }),
    }),
    { name: 'yumx-cart' }
  )
)

/** Derived helpers — call inside components */
export function cartTotalItems(items: CartItem[]) {
  return items.reduce((s, i) => s + i.quantity, 0)
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.price * i.quantity, 0)
}
