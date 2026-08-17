'use client'

import { useState } from 'react'
import { useCart } from '@/components/CartProvider'

type ProductDetailsClientProps = {
  product: {
    id: string
    slug: string
    name: string
    label: string
    price: number
    description: string
    image: string
    images: string[]
    weight: string | null
  }
}

export default function ProductDetailsClient({
  product,
}: ProductDetailsClientProps) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f0] px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-white">
            <div className="aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm uppercase tracking-widest text-stone-500">
              {product.label}
            </p>

            <h1 className="mt-2 text-4xl font-semibold text-[#173b25]">
              {product.name}
            </h1>

            <p className="mt-4 text-2xl font-semibold text-stone-900">
              ₹{product.price.toFixed(2)}
            </p>

            {product.weight && (
              <p className="mt-2 text-sm text-stone-500">
                Weight: {product.weight}
              </p>
            )}

            <p className="mt-6 leading-7 text-stone-600">
              {product.description}
            </p>

            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-stone-700">
                Quantity
              </p>

              <div className="flex w-fit items-center overflow-hidden rounded-full border border-stone-300 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                  className="flex h-11 w-11 items-center justify-center text-lg text-stone-700 hover:bg-stone-100"
                >
                  −
                </button>

                <span className="flex h-11 w-12 items-center justify-center text-sm font-medium">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((current) => current + 1)}
                  className="flex h-11 w-11 items-center justify-center text-lg text-stone-700 hover:bg-stone-100"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-6 w-full rounded-full bg-[#173b25] py-4 text-sm font-medium text-white transition hover:bg-[#245534] md:w-80"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
