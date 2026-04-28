import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/shared/providers'
import { OfflineBanner } from '@/components/shared/offline-banner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HighlyAligned — Spiritual Wellness, E-Commerce & Booking',
  description:
    'Align your mind, body, and spirit with curated crystals, healing services, and personalized astrology guidance. Shop spiritual products, book consultations, and get free Vedic astrology reports.',
  keywords: [
    'astrology',
    'vedic astrology',
    'crystals',
    'healing',
    'tarot',
    'spiritual wellness',
    'horoscope',
    'kundali',
    'India',
  ],
  authors: [{ name: 'Harshada Yogesh' }],
  creator: 'Harshada Yogesh',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://highlyaligned.in'),
  openGraph: {
    title: 'HighlyAligned — Spiritual Wellness & Astrology',
    description: 'Curated crystals, healing services, and personalized astrology guidance.',
    url: '/',
    siteName: 'HighlyAligned',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HighlyAligned — Spiritual Wellness & Astrology',
    description: 'Curated crystals, healing services, and personalized astrology guidance.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "HighlyAligned",
              "url": "https://highlyaligned.in",
              "logo": "https://highlyaligned.in/icon-512.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-84688-83571",
                "contactType": "customer service"
              }
            })
          }}
        />
        <OfflineBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
