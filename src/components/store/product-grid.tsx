'use client'

import { ProductCard } from './product-card'
import type { ProductWithCategory } from '@/hooks/use-products'

interface ProductGridProps {
  products: ProductWithCategory[]
  onQuickView?: (product: ProductWithCategory) => void
}

export function ProductGrid({ products, onQuickView }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p>No products found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
      ))}
    </div>
  )
}
