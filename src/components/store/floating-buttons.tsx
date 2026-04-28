'use client'

import { Phone, MessageCircle } from 'lucide-react'

export default function FloatingButtons() {
  const phone = '+918468883571'

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3 md:bottom-8 md:right-8">
      {/* WhatsApp */}
      <a
        href={`https://wa.me/${phone.replace('+', '')}?text=Hi%20HighlyAligned!%20I%20need%20guidance.`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#1ebe5b] hover:scale-110 transition-all"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>

      {/* Call */}
      <a
        href={`tel:${phone}`}
        className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-amber-600 hover:scale-110 transition-all"
        aria-label="Call us"
      >
        <Phone className="h-5 w-5" />
      </a>
    </div>
  )
}
