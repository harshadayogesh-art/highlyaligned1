'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'

interface CartIconProps {
  onClick: () => void
  className?: string
}

export function CartIcon({ onClick, className }: CartIconProps) {
  const count = useCartStore((s) => s.itemCount())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Button variant="ghost" size="icon" className={`relative ${className || ''}`} onClick={onClick}>
      <ShoppingCart className="h-5 w-5" />
      {mounted && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-400 text-[10px] font-bold text-violet-950 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Button>
  )
}
