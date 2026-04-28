'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useBlogPost, usePublishedBlogPosts, type BlogPost } from '@/hooks/use-blog-posts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Share2,
  MessageCircle,
  ArrowLeft,
  Clock,
  User,
  Link2,
  CopyCheck,
} from 'lucide-react'

function estimateReadTime(content: string | null): number {
  if (!content) return 1
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function isHTML(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str)
}

function ShareBar({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        className='rounded-full border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800'
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')}
      >
        <MessageCircle className='h-4 w-4 mr-1.5' /> WhatsApp
      </Button>
      <Button
        variant='outline'
        size='sm'
        className='rounded-full border-slate-300 text-slate-700 hover:bg-slate-50'
        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')}
      >
        <Share2 className='h-4 w-4 mr-1.5' /> X / Twitter
      </Button>
      <Button
        variant='outline'
        size='sm'
        className='rounded-full border-slate-300 text-slate-700 hover:bg-slate-50'
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')}
      >
        <Share2 className='h-4 w-4 mr-1.5' /> Facebook
      </Button>
      <Button
        variant='outline'
        size='sm'
        className='rounded-full'
        onClick={handleCopy}
      >
        {copied ? <CopyCheck className='h-4 w-4 mr-1.5 text-green-600' /> : <Link2 className='h-4 w-4 mr-1.5' />}
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
    </div>
  )
}

function RelatedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className='group block'>
      <article className='bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 hover:border-slate-200'>
        <div className='relative h-40 bg-slate-100 overflow-hidden'>
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className='object-cover group-hover:scale-105 transition-transform duration-500'
              sizes='(max-width: 640px) 100vw, 33vw'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 text-3xl'>✨</div>
          )}
        </div>
        <div className='p-4 space-y-2'>
          <Badge variant='outline' className='text-[10px]'>{post.category || 'Article'}</Badge>
          <h4 className='font-medium text-sm text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug'>
            {post.title}
          </h4>
          <div className='flex items-center gap-2 text-[11px] text-slate-400'>
            <Calendar className='h-3 w-3' />
            {formatDate(post.published_at || post.created_at)}
          </div>
        </div>
      </article>
    </Link>
  )
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: post, isLoading } = useBlogPost(slug)
  const { data: relatedPosts } = usePublishedBlogPosts(post?.category || undefined)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href)
    }
  }, [slug])

  const related = useMemo(() => {
    if (!relatedPosts || !post) return []
    return relatedPosts.filter((p) => p.id !== post.id).slice(0, 3)
  }, [relatedPosts, post])

  const readTime = useMemo(() => estimateReadTime(post?.content || null), [post?.content])
  const shareText = post ? `${post.title} — HighlyAligned` : ''

  // Loading state
  if (isLoading || !post) {
    return (
      <div className='min-h-screen bg-white'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='h-4 w-32 bg-slate-100 rounded animate-pulse mb-6' />
          <div className='h-64 md:h-96 bg-slate-100 rounded-2xl animate-pulse mb-8' />
          <div className='h-8 w-3/4 bg-slate-100 rounded animate-pulse mb-4' />
          <div className='h-4 w-1/2 bg-slate-100 rounded animate-pulse mb-8' />
          <div className='space-y-3'>
            <div className='h-4 w-full bg-slate-100 rounded animate-pulse' />
            <div className='h-4 w-full bg-slate-100 rounded animate-pulse' />
            <div className='h-4 w-5/6 bg-slate-100 rounded animate-pulse' />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Image */}
      {post.featured_image && (
        <div className='relative w-full h-64 sm:h-80 md:h-[28rem] bg-slate-900'>
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className='object-cover opacity-90'
            sizes='100vw'
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
        </div>
      )}

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back link */}
        <div className={`${post.featured_image ? '-mt-8 relative z-10' : 'pt-8'}`}>
          <Link
            href='/blog'
            className='inline-flex items-center gap-1.5 text-sm font-medium text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full transition-colors'
          >
            <ArrowLeft className='h-4 w-4' /> Back to Blog
          </Link>
        </div>

        {/* Article Header */}
        <header className='pt-8 md:pt-10 pb-6 md:pb-8 border-b border-slate-100'>
          <Badge className='mb-4 bg-violet-100 text-violet-800 hover:bg-violet-100 font-semibold'>
            {post.category || 'Article'}
          </Badge>
          <h1 className='text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6'>
            {post.title}
          </h1>

          <div className='flex flex-wrap items-center gap-4 md:gap-6 text-sm text-slate-500'>
            <div className='flex items-center gap-2'>
              <div className='w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-xs'>
                {post.author.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className='font-medium text-slate-900 text-sm'>{post.author}</p>
                <p className='text-xs text-slate-400'>Author</p>
              </div>
            </div>
            <div className='hidden sm:block w-px h-8 bg-slate-200' />
            <span className='flex items-center gap-1.5'>
              <Calendar className='h-4 w-4 text-slate-400' />
              {formatDate(post.published_at || post.created_at)}
            </span>
            <span className='flex items-center gap-1.5'>
              <Clock className='h-4 w-4 text-slate-400' />
              {readTime} min read
            </span>
            <span className='flex items-center gap-1.5'>
              <User className='h-4 w-4 text-slate-400' />
              {post.views} views
            </span>
          </div>
        </header>

        {/* Article Content */}
        <article className='py-8 md:py-10'>
          {isHTML(post.content || '') ? (
            <div
              className='prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed'
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />
          ) : (
            <div className='prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-line'>
              {post.content}
            </div>
          )}
        </article>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className='pb-8 border-b border-slate-100'>
            <h4 className='text-sm font-semibold text-slate-900 mb-3'>Tags</h4>
            <div className='flex flex-wrap gap-2'>
              {post.tags.map((tag) => (
                <Badge key={tag} variant='secondary' className='text-xs px-3 py-1 rounded-full'>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className='py-8 border-b border-slate-100'>
          <h4 className='text-sm font-semibold text-slate-900 mb-3'>Share this article</h4>
          <ShareBar url={shareUrl} text={shareText} />
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <div className='py-10 md:py-14'>
            <h3 className='text-xl md:text-2xl font-bold text-slate-900 mb-6'>Related Articles</h3>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-5'>
              {related.map((p) => (
                <RelatedCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
