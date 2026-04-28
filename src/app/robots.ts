export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://highlyaligned.in'
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: '/admin/' },
      { userAgent: '*', disallow: '/api/' },
      { userAgent: '*', disallow: '/account/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
