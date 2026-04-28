'use client'

import { useCategories } from '@/hooks/use-categories'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProductFiltersProps {
  selectedCategory: string
  selectedSort: string
  search: string
  onCategoryChange: (val: string) => void
  onSortChange: (val: string) => void
  onSearchChange: (val: string) => void
}

export function ProductFilters({
  selectedCategory,
  selectedSort,
  search,
  onCategoryChange,
  onSortChange,
  onSearchChange,
}: ProductFiltersProps) {
  const { data: categories } = useCategories('product')

  return (
    <div className="space-y-3 mb-6">
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => onCategoryChange('')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === ''
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f59e0b]"
        />
        <Select value={selectedSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
