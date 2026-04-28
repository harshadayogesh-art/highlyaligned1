import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book Consultations | HighlyAligned',
  description: 'Book personalized Vedic astrology, tarot, and spiritual healing consultations with Harshada.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Vedic Astrology & Spiritual Consulting",
    "provider": {
      "@type": "Person",
      "name": "Harshada"
    },
    "areaServed": "Worldwide"
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
