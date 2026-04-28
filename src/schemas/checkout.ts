import { z } from 'zod'

export const addressSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile required'),
  email: z.string().email('Valid email required'),
  line1: z.string().min(1, 'Address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code required'),
  landmark: z.string().optional(),
  saveAddress: z.boolean().default(false),
})

export const checkoutSchema = z.object({
  address: addressSchema,
  paymentMode: z.enum(['online', 'cod']).default('online'),
  couponCode: z.string().optional(),
})

export type CheckoutFormValues = z.input<typeof checkoutSchema>
export type AddressValues = z.input<typeof addressSchema>
