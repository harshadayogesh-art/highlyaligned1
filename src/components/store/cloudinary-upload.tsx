'use client'

import { useState } from 'react'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { Loader2, Upload, X } from 'lucide-react'

interface CloudinaryUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export default function CloudinaryUpload({ value, onChange, label = 'Upload Image' }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setPreview(url)
      onChange(url)
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setPreview(undefined); onChange('') }}
            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-[#f59e0b] transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-slate-400 mb-1" />
              <span className="text-xs text-slate-500">{label}</span>
            </>
          )}
        </label>
      )}
    </div>
  )
}
