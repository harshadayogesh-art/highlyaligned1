import { z } from 'zod'

export const businessInfoSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  owner: z.string().min(1, 'Owner name is required'),
  mobile: z.string().min(1, 'Mobile is required'),
  email: z.string().email('Invalid email'),
  address: z.string().min(1, 'Address is required'),
  hours: z.string().optional(),
})

export const gstConfigSchema = z.object({
  enabled: z.boolean(),
  gstin: z.string().optional(),
  defaultRate: z.number().min(0).max(100).optional(),
  hsnCode: z.string().optional(),
})

export const serviceConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  duration: z.number().min(5),
  price: z.number().min(0),
  modes: z.array(z.enum(['video', 'phone', 'chat', 'in_person'])),
  color: z.string(),
  active: z.boolean(),
})

export const settingsFormSchema = z.object({
  businessInfo: businessInfoSchema,
  gstConfig: gstConfigSchema,
  services: z.array(serviceConfigSchema),
})

export type SettingsFormValues = z.infer<typeof settingsFormSchema>
