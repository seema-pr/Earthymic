'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { products, type ProductCategory } from '@/data/products'
import { useCart } from '@/components/CartProvider'

type ProductGridProps = {
  searchQuery?: string
}

export default function ProductGrid({
  searchQuery = '',
}: ProductGridProps) {
  const { addToCart } = useCart()

  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | 'all'>('all')

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        product.category === selectedCategory

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.label.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  return (
    <section className="px-5 py-12">
      <div className="mx-auto max-w-7xl">

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
              className="group overflow-hidden rounded-2xl bg-white shadow-sm"
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

        {filteredProducts.length === 0 && (
          <p className="py-12 text-center text-stone-500">
            No products found.
          </p>
        )}

      </div>
    </section>
  )
}