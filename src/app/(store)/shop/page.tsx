'use client'

import { useState } from 'react'
import { useProducts } from '@/hooks/use-products'
import { ProductGrid } from '@/components/store/product-grid'
import { ProductFilters } from '@/components/store/product-filters'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImageGallery } from '@/components/store/image-gallery'
import { useCartStore } from '@/stores/cart-store'
import { usePageBlockMap } from '@/components/store/page-block'
import type { ProductWithCategory } from '@/hooks/use-products'
import { Minus, Plus } from 'lucide-react'

export default function ShopPage() {
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [quickView, setQuickView] = useState<ProductWithCategory | null>(null)
  const [qty, setQty] = useState(1)

  const blocks = usePageBlockMap('shop')
  const { data } = useProducts({ category, search, status: 'published' })
  const addItem = useCartStore((s) => s.addItem)

  const sortedProducts = (() => {
    const list = [...(data?.data || [])]
    if (sort === 'price_asc') return list.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') return list.sort((a, b) => b.price - a.price)
    return list
  })()

  const handleAdd = (product: ProductWithCategory, quantity: number) => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        image: product.images[0] || '/placeholder.svg',
        price: product.price,
        mrp: product.mrp,
        maxStock: product.stock,
      },
      quantity
    )
    setQuickView(null)
    setQty(1)
  }

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">{(blocks['hero_title']?.content?.text as string) || 'Shop'}</h1>

      <ProductFilters
        selectedCategory={category}
        selectedSort={sort}
        search={search}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        onSearchChange={setSearch}
      />

      <ProductGrid
        products={sortedProducts}
        onQuickView={(p) => {
          setQuickView(p)
          setQty(1)
        }}
      />

      {/* Quick View Modal */}
      <Dialog open={!!quickView} onOpenChange={() => setQuickView(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {quickView && (
            <div className="space-y-4">
              <ImageGallery images={quickView.images} alt={quickView.name} />
              <h2 className="text-xl font-bold">{quickView.name}</h2>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-emerald-600">₹{quickView.price}</span>
                {quickView.mrp > quickView.price && (
                  <span className="text-lg text-slate-400 line-through">₹{quickView.mrp}</span>
                )}
              </div>
              <p className="text-sm text-slate-600 line-clamp-3">{quickView.description}</p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(quickView.stock, q + 1))}
                    className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold"
                  disabled={quickView.stock <= 0}
                  onClick={() => handleAdd(quickView, qty)}
                >
                  {quickView.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
