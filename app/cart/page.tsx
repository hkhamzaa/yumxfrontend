import { CartPageClient } from './CartPageClient'

export default function CartPage() {
  // Auth is unavailable during maintenance — cart works with null session user
  return <CartPageClient sessionUser={null} />
}
