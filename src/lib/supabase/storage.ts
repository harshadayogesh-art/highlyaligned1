import { createClient } from './client'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function uploadProductImage(file: File): Promise<string | null> {
  try {
    const url = await uploadToCloudinary(file)
    return url
  } catch (err) {
    console.error('Cloudinary upload error:', err)
    // Fallback to Supabase Storage if Cloudinary fails
    return uploadToSupabase(file)
  }
}

async function uploadToSupabase(file: File): Promise<string | null> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error } = await supabase.storage.from('products').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data } = supabase.storage.from('products').getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteProductImage(url: string) {
  // Only delete from Supabase Storage; Cloudinary cleanup is manual
  if (!url.includes('supabase.co')) return
  const supabase = createClient()
  const path = url.split('/products/').pop()
  if (!path) return
  await supabase.storage.from('products').remove([`products/${path}`])
}
