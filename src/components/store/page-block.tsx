'use client'

import { useMemo } from 'react'
import { usePageBlocks } from '@/hooks/use-page-blocks'

interface PageBlockProps {
  pageKey: string
  blockKey: string
  fallback?: string
  children?: (content: Record<string, unknown>, images: string[]) => React.ReactNode
}

export function PageBlock({ pageKey, blockKey, fallback, children }: PageBlockProps) {
  const { data: blocks } = usePageBlocks(pageKey)

  const block = useMemo(() => {
    return blocks?.find((b) => b.block_key === blockKey)
  }, [blocks, blockKey])

  if (children) {
    return <>{children(block?.content || {}, block?.images || [])}</>
  }

  const text = (block?.content?.text as string) || fallback || ''
  return <>{text}</>
}

export interface BlockData {
  content: Record<string, unknown>
  images: string[]
}

export function usePageBlockMap(pageKey: string) {
  const { data: blocks } = usePageBlocks(pageKey)
  return useMemo(() => {
    const map: Record<string, BlockData> = {}
    blocks?.forEach((b) => {
      map[b.block_key] = { content: b.content, images: b.images || [] }
    })
    return map
  }, [blocks])
}
