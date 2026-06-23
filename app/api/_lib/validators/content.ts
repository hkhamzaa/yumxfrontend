import { z } from 'zod'

export const CreateGalleryImageSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(200).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const UpdateGalleryImageSchema = CreateGalleryImageSchema.partial()

export const CreateTestimonialSchema = z.object({
  customerName: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(1).max(1000),
  source: z.string().max(100).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const UpdateTestimonialSchema = CreateTestimonialSchema.partial()

export const UpsertSiteContentSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z_]+$/, 'key must be lowercase letters and underscores'),
  value: z.string(),
})

export const UpdateSiteContentSchema = z.object({
  value: z.string(),
})

export const UpsertScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'openTime must be HH:MM'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'closeTime must be HH:MM'),
  isClosed: z.boolean().default(false),
})

export const UpdateScheduleSchema = UpsertScheduleSchema.omit({ dayOfWeek: true }).partial()
