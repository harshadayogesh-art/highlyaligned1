import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Astrology Report | HighlyAligned',
  description: 'Get your free personalized Vedic astrology reading and insights powered by AI.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
