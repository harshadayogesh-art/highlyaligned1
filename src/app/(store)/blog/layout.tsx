import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spiritual Insights & Astrology Blog | HighlyAligned',
  description: 'Read the latest insights on Vedic astrology, spiritual growth, remedies, and wellness from Harshada.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
