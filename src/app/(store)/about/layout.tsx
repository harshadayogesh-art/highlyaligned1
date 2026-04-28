import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Harshada | HighlyAligned',
  description: 'Learn about Harshada, an experienced Vedic astrologer and spiritual healer dedicated to helping you align with your true purpose.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
