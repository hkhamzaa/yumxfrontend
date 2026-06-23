import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens').optional(),
  imageUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

export const CreateMenuItemSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  categoryId: z.string().cuid(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        label: z.string().min(1).max(50),
        price: z.number().positive().multipleOf(0.01),
      }),
    )
    .min(1, 'Every menu item must have at least one variant'),
})

export const UpdateMenuItemSchema = CreateMenuItemSchema.omit({ variants: true }).partial()

export const CreateVariantSchema = z.object({
  label: z.string().min(1).max(50),
  price: z.number().positive().multipleOf(0.01),
})

export const UpdateVariantSchema = CreateVariantSchema.partial()

export const CreateComboDealSchema = z.object({
  dealNumber: z.string().min(1).max(20),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  price: z.number().positive().multipleOf(0.01),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
})

export const UpdateComboDealSchema = CreateComboDealSchema.partial()
