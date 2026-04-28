'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [mainIndex, setMainIndex] = useState(0)
  const validImages = images.length > 0 ? images : ['/placeholder.svg']

  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-slate-50 rounded-xl overflow-hidden">
        <Image
          src={validImages[mainIndex]}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setMainIndex(idx)}
              className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                idx === mainIndex ? 'border-[#f59e0b]' : 'border-transparent'
              }`}
            >
              <Image
                src={img}
                alt={`${alt} ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
