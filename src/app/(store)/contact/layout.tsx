import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | HighlyAligned',
  description: 'Get in touch with us for support, consultation queries, or business inquiries.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
