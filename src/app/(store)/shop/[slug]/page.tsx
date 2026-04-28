'use client'

import { useState } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useProduct } from '@/hooks/use-products'
import { useCategories } from '@/hooks/use-categories'
import { ImageGallery } from '@/components/store/image-gallery'
import { ProductCard } from '@/components/store/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCartStore } from '@/stores/cart-store'
import { createClient } from '@/lib/supabase/client'
import { Minus, Plus, ShoppingCart, Zap } from 'lucide-react'
import type { ProductWithCategory } from '@/hooks/use-products'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { data: product, isLoading } = useProduct(slug)
  const { data: categories } = useCategories('product')
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const clearCart = useCartStore((s) => s.clearCart)

  if (isLoading) {
    return (
      <div className="px-4 py-16 text-center text-slate-500">
        <p>Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return notFound()
  }

  const isOutOfStock = product.status === 'out_of_stock' || product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock < 10
  const savings = product.mrp - product.price
  const categoryName = categories?.find((c) => c.id === product.category_id)?.name

  const handleAddToCart = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        image: product.images[0] || '/placeholder.svg',
        price: product.price,
        mrp: product.mrp,
        maxStock: product.stock,
      },
      qty
    )
  }

  const handleBuyNow = () => {
    clearCart()
    addItem(
      {
        productId: product.id,
        name: product.name,
        image: product.images[0] || '/placeholder.svg',
        price: product.price,
        mrp: product.mrp,
        maxStock: product.stock,
      },
      qty
    )
    router.push('/checkout')
  }

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto pb-28 md:pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <ImageGallery images={product.images} alt={product.name} />

        {/* Info */}
        <div className="space-y-4">
          {categoryName && (
            <Badge variant="outline" className="text-xs">
              {categoryName}
            </Badge>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{product.name}</h1>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-emerald-600">₹{product.price}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-lg text-slate-400 line-through">₹{product.mrp}</span>
                <Badge className="bg-emerald-100 text-emerald-800">Save ₹{savings}</Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
            ) : isLowStock ? (
              <Badge className="bg-amber-100 text-amber-800">Only {product.stock} left</Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-800">In Stock</Badge>
            )}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-medium text-lg">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-[#f59e0b] text-slate-900 font-semibold hover:bg-amber-50"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
            >
              <Zap className="h-5 w-5 mr-2" />
              Buy Now
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="pt-4">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="how_to_use">How to Use</TabsTrigger>
              <TabsTrigger value="energization">Energization</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="text-sm text-slate-600 mt-4">
              {product.description || 'No description available.'}
            </TabsContent>
            <TabsContent value="how_to_use" className="text-sm text-slate-600 mt-4">
              {product.how_to_use || 'No usage instructions available.'}
            </TabsContent>
            <TabsContent value="energization" className="text-sm text-slate-600 mt-4">
              {product.energization_process || 'No energization process available.'}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Related Products */}
      {product.category_id && <RelatedProducts categoryId={product.category_id} excludeId={product.id} />}

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 md:hidden z-40">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center font-medium">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <Button
            variant="outline"
            className="flex-1 border-[#f59e0b] text-slate-900 font-semibold text-sm"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add
          </Button>
          <Button
            className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold text-sm"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
          >
            <Zap className="h-4 w-4 mr-1" />
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  )
}

function RelatedProducts({ categoryId, excludeId }: { categoryId: string; excludeId: string }) {
  const { data } = useQuery({
    queryKey: ['related-products', categoryId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('category_id', categoryId)
        .eq('status', 'published')
        .neq('id', excludeId)
        .limit(4)
      if (error) throw error
      return data as ProductWithCategory[]
    },
  })

  if (!data || data.length === 0) return null

  return (
    <div className="mt-12 border-t border-slate-100 pt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Related Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
