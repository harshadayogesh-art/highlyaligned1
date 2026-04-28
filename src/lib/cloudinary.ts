export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'highlyaligned_unsigned',
  folder: 'highlyaligned',
}

export async function uploadToCloudinary(file: File): Promise<string> {
  if (!cloudinaryConfig.cloudName) {
    throw new Error('Cloudinary cloud name not configured')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', cloudinaryConfig.uploadPreset)
  formData.append('folder', cloudinaryConfig.folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.secure_url
}

export function getOptimizedImage(url: string, width: number = 800): string {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`)
}


