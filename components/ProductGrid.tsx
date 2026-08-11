'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { products, type ProductCategory } from '@/data/products'

const filters: {
  label: string
  value: ProductCategory | 'all'
}[] = [
  { label: 'All', value: 'all' },
  { label: 'Hair Care', value: 'hair' },
  { label: 'Skin Care', value: 'skin' },
  { label: 'Wellness', value: 'wellness' },
]

export default function ProductGrid() {
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')

  const [search, setSearch] = useState('')

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        category === 'all' || product.category === category

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.label.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [category, search])

  return (
    <section id="shop" className="bg-[#f8f6f0] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Our Collection
          </p>

          <h2 className="text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
            Natural Products
          </h2>
        </div>

        {/* Filters + Search */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setCategory(filter.value)}
                className={`rounded-full px-5 py-2 text-sm transition-colors ${
                  category === filter.value
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-200/60 text-stone-700 hover:bg-stone-300/60'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search herbs..."
            className="w-full rounded-full border border-stone-300 bg-white/60 px-5 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-600 sm:max-w-xs"
          />
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl bg-white"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-stone-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {/* Details */}
              <div className="p-5">
                <p className="mb-2 text-[10px] font-medium tracking-[0.18em] text-stone-400">
                  {product.label}
                </p>

                <h3 className="text-lg font-medium text-stone-900">
                  {product.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {product.description}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-lg font-medium text-stone-900">
                    ₹{product.price}
                  </span>

                  <button
                    type="button"
                    className="rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-700"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <p className="py-16 text-center text-sm text-stone-500">
            No products found.
          </p>
        )}
      </div>
    </section>
  )
}
