import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Flame, ArrowDownUp, Leaf } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import CategoryTabs from '../../components/CategoryTabs/CategoryTabs'
import MenuList from '../../components/MenuList/MenuList'
import MenuDetails from '../../components/MenuDetails/MenuDetails'
import SectionHeading from '../../components/ui/SectionHeading'
import type { MenuItem } from '../../types'

type SortOption = 'default' | 'name_desc'| 'price_asc' | 'price_desc' | 'best_selling'  | 'prep_time_asc'| 'prep_time_desc'

const SORT_LABELS: Record<SortOption, string> = {
 default: 'Name: A to Z',
  name_desc: 'Name: Z to A',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  best_selling: 'Best Selling',
  prep_time_asc: 'Prep Time: Short to Long',
  prep_time_desc: 'Prep Time: Long to Short'
}

export default function Menu() {
  const { categories, items, isLoading } = useMenu()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeCategory, setActiveCategory] = useState<string | null>(searchParams.get('category'))
  const [search, setSearch] = useState('')
  const [bestSellerOnly, setBestSellerOnly] = useState(searchParams.get('filter') === 'best_seller')
  const [seasonalOnly, setSeasonalOnly] = useState(searchParams.get('filter') === 'seasonal')
  const [sort, setSort] = useState<SortOption>('default')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  const maxPrice = useMemo(
  () => Math.ceil(Math.max(0, ...items.map((i) => i.price))),
  [items]
)

const [minPrice, setMinPrice] = useState(0)
const [maxSelectedPrice, setMaxSelectedPrice] = useState(maxPrice)

useEffect(() => {
  setMaxSelectedPrice(maxPrice)
}, [maxPrice])

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const key of ['tableId', 'tableNumber', 'reservationId']) {
      const value = searchParams.get(key)
      if (value) next[key] = value
    }
    if (activeCategory) next.category = activeCategory
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory])

  const filteredItems = useMemo(() => {
   let result = items.filter(
  (item) =>
    item.price >= minPrice &&
    item.price <= maxSelectedPrice
)

    if (activeCategory) result = result.filter((i) => i.categoryId === activeCategory)
    if (bestSellerOnly) result = result.filter((i) => i.isBestSeller)
    if (seasonalOnly) result = result.filter((i) => i.isSeasonal)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q)
      )
    }

    switch (sort) {
       case 'name_desc':
    result = [...result].sort((a, b) => b.name.localeCompare(a.name))
    break
      case 'price_asc':
        result = [...result].sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        result = [...result].sort((a, b) => b.price - a.price)
        break
      case 'best_selling':
        result = [...result].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
        break
         case 'prep_time_asc':
    result = [...result].sort(
      (a, b) => (a.prepTimeMinutes || 0) - (b.prepTimeMinutes || 0)
    )
    break

  case 'prep_time_desc':
    result = [...result].sort(
      (a, b) => (b.prepTimeMinutes || 0) - (a.prepTimeMinutes || 0)
    )
    break
      default:
  result = [...result].sort((a, b) => a.name.localeCompare(b.name))
  break
    }

    return result
  }, [items, activeCategory, bestSellerOnly, seasonalOnly, search, minPrice, maxSelectedPrice, sort])

  const activeCategoryObj = categories.find((c) => c._id === selectedItem?.categoryId)

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-32 pb-24">
      <SectionHeading
        eyebrow="The Full Menu"
        title="Every"
        accent="course."
        description="Search, filter by element, or sort by what the table orders most."
      />

      <div className="mt-10 mb-8">
        <CategoryTabs categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end mb-10 pb-8 border-b border-white/10">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Search</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes or ingredients…"
                className="field !pl-10"
              />
            </div>
          </div>

          <div>
             <label className="block text-[11px] uppercase tracking-widest2 text-bone-faint mb-3">
    Price Range — ${minPrice} to ${maxSelectedPrice}
  </label>

  <div className="space-y-4 mt-2">
    <div>
      <p className="text-[10px] uppercase tracking-widest2 text-bone-faint mb-1">
        Min Price
      </p>
      <input
        type="range"
        min={0}
        max={maxPrice}
        value={minPrice}
        onChange={(e) =>
          setMinPrice(
            Math.min(Number(e.target.value), maxSelectedPrice)
          )
        }
        className="w-full accent-ember"
      />
    </div>

    <div>
      <p className="text-[10px] uppercase tracking-widest2 text-bone-faint mb-1">
        Max Price
      </p>
      <input
        type="range"
        min={0}
        max={maxPrice}
        value={maxSelectedPrice}
        onChange={(e) =>
          setMaxSelectedPrice(
            Math.max(Number(e.target.value), minPrice)
          )
        }
        className="w-full accent-ember"
      />
    </div>
  </div>
</div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setBestSellerOnly((v) => !v)}
            className={`flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-widest2 border transition-colors ${
              bestSellerOnly ? 'bg-ember border-ember text-noir-950' : 'border-white/15 text-bone-dim hover:border-white/40'
            }`}
          >
            <Flame size={13} /> Best Sellers
          </button>

          <button
            onClick={() => setSeasonalOnly((v) => !v)}
            className={`flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-widest2 border transition-colors ${
              seasonalOnly ? 'bg-ember border-ember text-noir-950' : 'border-white/15 text-bone-dim hover:border-white/40'
            }`}
          >
            <Leaf size={13} /> Seasonal
          </button>

          <div className="relative">
            <ArrowDownUp size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-faint pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="field !pl-10"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-bone-dim text-sm">Loading the menu…</p>
      ) : (
        <MenuList items={filteredItems} onSelect={setSelectedItem} />
      )}

      <MenuDetails item={selectedItem} category={activeCategoryObj} onClose={() => setSelectedItem(null)} />
    </div>
  )
}
