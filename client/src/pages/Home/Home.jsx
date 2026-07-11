import { useEffect, useState } from 'react'

import Navbar from '../../components/Navbar/Navbar'
import Hero from '../../components/Hero/Hero'
import FeaturedMenu from '../../components/FeaturedMenu/FeaturedMenu'
import CategoryTabs from '../../components/CategoryTabs/CategoryTabs'
import MenuList from '../../components/MenuList/MenuList'
import MenuDetails from '../../components/MenuDetails/MenuDetails'
import QuoteSection from '../../components/QuoteSection/QuoteSection'
import Footer from '../../components/Footer/Footer'
import OrderDrawer from '../../components/OrderDrawer/OrderDrawer'
import SectionHeading from '../../components/ui/SectionHeading'

import { useMenu } from '../../hooks/useMenu'


export default function Home() {
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const [activeItemId, setActiveItemId] = useState(null)

  const {
    categories,
    items,
    isLoading,
    isLoadingItems,
    error,
  } = useMenu(activeCategoryId)

  // Select the first category after categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0]._id)
    }
  }, [categories, activeCategoryId])

  // Select the first item after category items load
  useEffect(() => {
    if (items.length === 0) {
      setActiveItemId(null)
      return
    }

    const currentItemExists = items.some(
      (item) => item._id === activeItemId,
    )

    if (!currentItemExists) {
      setActiveItemId(items[0]._id)
    }
  }, [items, activeItemId])

  const activeCategory = categories.find(
    (category) => category._id === activeCategoryId,
  )

  const activeItem = items.find(
    (item) => item._id === activeItemId,
  )

  const featuredItems = items.slice(0, 3)

  function handleCategorySelect(categoryId) {
    setActiveCategoryId(categoryId)
    setActiveItemId(null)
  }

  return (
    <>
      <Navbar />
      <OrderDrawer />

      <main>
        <Hero />

        {!isLoadingItems && featuredItems.length > 0 && (
          <FeaturedMenu items={featuredItems} />
        )}

        <section
          id="menu"
          className="max-w-[1400px] mx-auto px-6 md:px-10 py-24"
        >
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
            <SectionHeading
              eyebrow="The Tasting Menu"
              title="Three"
              accent="elements."
            />

            <p className="text-bone-dim text-sm max-w-xs">
              Choose an element, then wander its courses. Each dish is a
              study in restraint.
            </p>
          </div>

          {error && (
            <p className="mb-6 text-red-400">
              Could not load menu information.
            </p>
          )}

          {categories.length > 0 && (
            <CategoryTabs
              categories={categories}
              activeId={activeCategoryId}
              onSelect={handleCategorySelect}
            />
          )}

          {activeCategory && (
            <div className="flex items-center justify-between mt-10 mb-6 flex-wrap gap-4">
              <blockquote className="font-display italic text-2xl md:text-3xl text-bone">
                {activeCategory.quote}
              </blockquote>

              <p className="eyebrow">
                {activeCategory.servedNote}
              </p>
            </div>
          )}

          {isLoadingItems && (
            <p className="py-10 text-bone-dim">
              Loading menu items...
            </p>
          )}

          {!isLoading && activeCategoryId && items.length === 0 && (
            <p className="py-10 text-bone-dim">
              No menu items were found for this category.
            </p>
          )}

          {!isLoadingItems && items.length > 0 && (
            <div className="grid md:grid-cols-2 border border-white/10 md:divide-x md:divide-white/10">
              <MenuList
                items={items}
                activeItemId={activeItemId}
                onSelect={setActiveItemId}
              />

              <MenuDetails
                item={activeItem}
                category={activeCategory}
              />
            </div>
          )}
        </section>

        <QuoteSection />
      </main>

      <Footer />
    </>
  )
}