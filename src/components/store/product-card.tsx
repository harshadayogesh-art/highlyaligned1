'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Eye } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import type { ProductWithCategory } from '@/hooks/use-products'

interface ProductCardProps {
  product: ProductWithCategory
  onQuickView?: (product: ProductWithCategory) => void
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const isOutOfStock = product.status === 'out_of_stock' || product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock < 10
  const image = product.images[0] || '/placeholder.svg'

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addItem(
      {
        productId: product.id,
        name: product.name,
        image,
        price: product.price,
        mrp: product.mrp,
        maxStock: product.stock,
      },
      1
    )
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(product)
  }

  if (!product.slug) return null

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        <Image
          src={image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Out of Stock
            </Badge>
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-500 text-white text-xs">Only {product.stock} left</Badge>
          </div>
        )}
        {onQuickView && (
          <button
            onClick={handleQuickView}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            aria-label="Quick view"
          >
            <Eye className="h-4 w-4 text-slate-700" />
          </button>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-emerald-600">₹{product.price}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
          )}
        </div>

        <Button
          size="sm"
          className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-medium"
          disabled={isOutOfStock}
          onClick={handleAdd}
        >
          <ShoppingCart className="h-4 w-4 mr-1.5" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </Link>
  )
}
