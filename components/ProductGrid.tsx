'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { products, type ProductCategory } from '@/data/products'
import { useCart } from '@/components/CartProvider'

export default function ProductGrid() {
  const { addToCart } = useCart()

  const [searchQuery, setSearchQuery] = useState('')

  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | 'all'
  >('all')

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.label.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  return (
    <section id="shop" className="px-5 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Shop Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#173b25]">Shop</h2>

            <p className="mt-1 text-sm text-stone-500">Explore our products</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              strokeWidth={1.7}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm text-stone-900 outline-none transition focus:border-[#173b25]"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-5 py-2 text-sm transition ${
              selectedCategory === 'all'
                ? 'bg-[#173b25] text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('hair')}
            className={`rounded-full px-5 py-2 text-sm transition ${
              selectedCategory === 'hair'
                ? 'bg-[#173b25] text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Hair
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('skin')}
            className={`rounded-full px-5 py-2 text-sm transition ${
              selectedCategory === 'skin'
                ? 'bg-[#173b25] text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Skin
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('wellness')}
            className={`rounded-full px-5 py-2 text-sm transition ${
              selectedCategory === 'wellness'
                ? 'bg-[#173b25] text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Wellness
          </button>
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl bg-[#f8f6f0] shadow-sm"
            >
              <Link href={`/products/${product.id}`}>
                <div className="aspect-square overflow-hidden bg-stone-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-500">
                    {product.label}
                  </p>

                  <h3 className="mt-1 font-medium text-stone-900">
                    {product.name}
                  </h3>

                  <p className="mt-2 font-semibold text-[#173b25]">
                    ₹{product.price.toFixed(2)}
                  </p>
                </div>
              </Link>

              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  className="w-full rounded-full bg-[#173b25] py-2.5 text-sm font-medium text-white transition hover:bg-[#245534]"
                >
                  Add to Cart
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <p className="py-12 text-center text-stone-500">No products found.</p>
        )}
      </div>
    </section>
  )
}
