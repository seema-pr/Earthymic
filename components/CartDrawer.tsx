'use client'

import Image from 'next/image'
import { useCart } from '@/components/CartProvider'

type CartDrawerProps = {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } =
    useCart()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
          <h2 className="text-lg font-medium text-stone-900">Your Cart</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-sm text-stone-500 hover:text-stone-900"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cartItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-500">
              Your cart is empty.
            </p>
          ) : (
            <div className="space-y-5">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-stone-100 pb-5"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-stone-900">{item.name}</h3>

                    <p className="mt-1 text-sm text-stone-500">₹{item.price}</p>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="h-7 w-7 rounded-full bg-stone-100"
                      >
                        -
                      </button>

                      <span className="text-sm">{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="h-7 w-7 rounded-full bg-stone-100"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-xs text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-stone-200 px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-stone-500">Total</span>

              <span className="text-lg font-medium text-stone-900">
                ₹{cartTotal}
              </span>
            </div>

            <button
              type="button"
              onClick={clearCart}
              className="w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-white hover:bg-stone-700"
            >
              Clear Cart
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
