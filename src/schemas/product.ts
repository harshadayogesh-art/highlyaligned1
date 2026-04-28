import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  how_to_use: z.string().optional(),
  energization_process: z.string().optional(),
  category_id: z.string().optional(),
  mrp: z.number().min(0, 'MRP must be >= 0'),
  price: z.number().min(0, 'Price must be >= 0'),
  stock: z.number().int().min(0, 'Stock must be >= 0'),
  sku: z.string().optional(),
  weight_grams: z.number().int().min(0).optional(),
  images: z.array(z.string()),
  gst_applicable: z.boolean(),
  gst_rate: z.number().min(0).max(100),
  status: z.enum(['draft', 'published', 'out_of_stock', 'hidden']),
  is_featured: z.boolean().default(false),
})

export type ProductFormValues = z.input<typeof productSchema>
