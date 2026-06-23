import { z } from 'zod'

const OrderItemSchema = z
  .object({
    menuItemVariantId: z.string().cuid().optional(),
    comboDealId: z.string().cuid().optional(),
    quantity: z.number().int().min(1).max(50),
  })
  .superRefine((item, ctx) => {
    const hasVariant = !!item.menuItemVariantId
    const hasDeal = !!item.comboDealId
    if (hasVariant === hasDeal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Each item must have exactly one of menuItemVariantId or comboDealId',
      })
    }
  })

export const CreateOrderSchema = z
  .object({
    orderType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']),
    guestName: z.string().min(1).max(100).optional(),
    guestPhone: z.string().min(7).max(20).optional(),
    guestEmail: z.string().email().optional().nullable(),
    guestAddress: z.string().min(5).max(500).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    items: z.array(OrderItemSchema).min(1).max(30),
  })
  .superRefine((data, ctx) => {
    if (data.orderType === 'DELIVERY' && !data.guestAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['guestAddress'],
        message: 'Delivery address is required for DELIVERY orders',
      })
    }
  })

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
