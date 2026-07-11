import { useState } from 'react'
import Hero from '../../components/Hero/Hero'
import BestSellers from '../../components/BestSellers/BestSellers'
import SeasonalPicks from '../../components/SeasonalPicks/SeasonalPicks'
import QuoteSection from '../../components/QuoteSection/QuoteSection'
import CTASection from '../../components/CTASection/CTASection'
import MenuDetails from '../../components/MenuDetails/MenuDetails'
import { useMenu } from '../../hooks/useMenu'
import { featured } from '../../services/mockData'
import type { MenuItem } from '../../types'

export default function Home() {
  const { categories, items, isLoading } = useMenu()
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  const bestSellers = items.filter((i) => i.isBestSeller).slice(0, 3)
  const seasonalPicks = items.filter((i) => i.isSeasonal).slice(0, 4)
  const selectedCategory = categories.find((c) => c._id === selectedItem?.categoryId)

  return (
    <>
      <Hero featured={featured} />
      {!isLoading && <BestSellers items={bestSellers} onSelect={setSelectedItem} />}
      {!isLoading && <SeasonalPicks items={seasonalPicks} onSelect={setSelectedItem} />}
      <QuoteSection />
      <CTASection />

      <MenuDetails item={selectedItem} category={selectedCategory} onClose={() => setSelectedItem(null)} />
    </>
  )
}
