'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [mainIndex, setMainIndex] = useState(0)
  const validImages = images.length > 0 ? images : ['/placeholder.svg']
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const goTo = useCallback((idx: number) => {
    setMainIndex((prev) => {
      if (idx < 0) return validImages.length - 1
      if (idx >= validImages.length) return 0
      return idx
    })
  }, [validImages.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX
    if (touchStartX.current === null || touchEndX.current === null) return
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goTo(mainIndex + 1)
      } else {
        goTo(mainIndex - 1)
      }
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-square bg-slate-50 rounded-xl overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={validImages[mainIndex]}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {/* Swipe hint dots on mobile */}
        {validImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
            {validImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === mainIndex ? 'bg-white w-4' : 'bg-white/50'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
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
