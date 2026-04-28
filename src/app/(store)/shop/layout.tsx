import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop Sacred Products | HighlyAligned',
  description: 'Browse our curated collection of energized crystals, yantras, and spiritual wellness products.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
