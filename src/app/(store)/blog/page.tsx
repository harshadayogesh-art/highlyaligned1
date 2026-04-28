'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePublishedBlogPosts } from '@/hooks/use-blog-posts'
import { usePageBlockMap } from '@/components/store/page-block'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Search, Clock, ArrowRight, User } from 'lucide-react'

const CATEGORIES = ['All', 'Astrology', 'Crystals', 'Rituals', 'Tarot', 'Chakra', 'Vastu', 'Events']

function estimateReadTime(content: string | null): number {
  if (!content) return 1
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogListingPage() {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const blocks = usePageBlockMap('blog')
  const { data: posts, isLoading } = usePublishedBlogPosts(category === 'All' ? undefined : category)

  const filtered = useMemo(() => {
    if (!posts) return []
    const term = search.toLowerCase().trim()
    if (!term) return posts
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.excerpt || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)
    )
  }, [posts, search])

  const featured = filtered[0]
  const rest = filtered.slice(1)

  const heroTitle = (blocks['hero_title']?.content?.text as string) || 'Blog'
  const heroSubtitle = (blocks['hero_subtitle']?.content?.text as string) || 'Insights on astrology, crystals, healing, and spiritual growth.'

  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Header */}
      <section className='bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 text-white'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 md:pt-16 md:pb-14'>
          <div className='max-w-2xl'>
            <h1 className='text-3xl md:text-4xl font-bold tracking-tight mb-3'>{heroTitle}</h1>
            <p className='text-violet-200 text-base md:text-lg leading-relaxed'>{heroSubtitle}</p>
          </div>
        </div>
      </section>

      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10'>
        {/* Search + Category Bar */}
        <div className='bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-5 space-y-4'>
          <div className='relative'>
            <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search articles...'
              className='pl-10 h-11 rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-100'
            />
          </div>
          <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-hide'>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === c
                    ? 'bg-violet-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10'>
        {/* Loading */}
        {isLoading && (
          <div className='space-y-6'>
            <div className='h-72 md:h-96 bg-slate-100 rounded-2xl animate-pulse' />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='h-80 bg-slate-100 rounded-2xl animate-pulse' />
              ))}
            </div>
          </div>
        )}

        {/* Featured Post */}
        {!isLoading && featured && (
          <Link href={`/blog/${featured.slug}`} className='group block'>
            <article className='relative rounded-2xl overflow-hidden bg-slate-900 shadow-xl'>
              <div className='relative h-72 md:h-[28rem]'>
                {featured.featured_image ? (
                  <Image
                    src={featured.featured_image}
                    alt={featured.title}
                    fill
                    className='object-cover opacity-80 group-hover:opacity-70 group-hover:scale-[1.02] transition-all duration-700'
                    sizes='100vw'
                    priority
                  />
                ) : (
                  <div className='w-full h-full bg-gradient-to-br from-violet-800 to-indigo-900' />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent' />
              </div>
              <div className='absolute bottom-0 left-0 right-0 p-5 md:p-8'>
                <Badge className='mb-3 bg-amber-400 text-violet-950 hover:bg-amber-400 font-semibold text-xs'>
                  {featured.category || 'Article'}
                </Badge>
                <h2 className='text-xl md:text-3xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors leading-snug'>
                  {featured.title}
                </h2>
                <p className='text-slate-300 text-sm md:text-base line-clamp-2 mb-4 max-w-2xl'>
                  {featured.excerpt}
                </p>
                <div className='flex items-center gap-4 text-slate-400 text-sm'>
                  <span className='flex items-center gap-1.5'>
                    <User className='h-3.5 w-3.5' />
                    {featured.author}
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <Calendar className='h-3.5 w-3.5' />
                    {formatDate(featured.published_at || featured.created_at)}
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <Clock className='h-3.5 w-3.5' />
                    {estimateReadTime(featured.content)} min read
                  </span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Post Grid */}
        {!isLoading && rest.length > 0 && (
          <div>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg md:text-xl font-bold text-slate-900'>Latest Articles</h2>
              <span className='text-sm text-slate-500'>{rest.length} article{rest.length !== 1 ? 's' : ''}</span>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {rest.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className='group flex flex-col'>
                  <article className='flex flex-col h-full bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all duration-300'>
                    <div className='relative h-52 bg-slate-100 overflow-hidden'>
                      {post.featured_image ? (
                        <Image
                          src={post.featured_image}
                          alt={post.title}
                          fill
                          className='object-cover group-hover:scale-105 transition-transform duration-500'
                          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 text-4xl'>✨</div>
                      )}
                      <div className='absolute top-3 left-3'>
                        <Badge variant='secondary' className='bg-white/90 backdrop-blur text-slate-700 font-medium text-xs'>
                          {post.category || 'Article'}
                        </Badge>
                      </div>
                    </div>
                    <div className='flex flex-col flex-1 p-5 space-y-3'>
                      <h3 className='font-semibold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug'>
                        {post.title}
                      </h3>
                      <p className='text-sm text-slate-500 line-clamp-2 leading-relaxed'>
                        {post.excerpt}
                      </p>
                      <div className='flex items-center gap-3 pt-2 mt-auto text-xs text-slate-400'>
                        <span className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                        <span>•</span>
                        <span className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {estimateReadTime(post.content)} min
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className='text-center py-20'>
            <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl'>🔍</div>
            <h3 className='text-lg font-semibold text-slate-900 mb-1'>No articles found</h3>
            <p className='text-slate-500 text-sm'>Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
