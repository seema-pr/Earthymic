'use client'

import Image from 'next/image'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { useRouter } from 'next/navigation'

type CartDrawerProps = {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({
  open,
  onClose,
}: CartDrawerProps) {
  const router = useRouter()
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
    clearCart,
  } = useCart()

  const gst = cartTotal * 0.18
  const shipping = cartTotal >= 999 ? 0 : 50
  const grandTotal = cartTotal + gst + shipping
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]">

      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Cart panel */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f8f6f0] shadow-2xl">

        {/* Header */}
        <div className="
          flex
          shrink-0
          items-center
          justify-between
          border-b
          border-stone-200
          bg-white
          px-6
          py-5
        ">

          <div className="flex items-center gap-3">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#e8efdc]
              text-[#173b25]
            ">
              <ShoppingBag
                size={19}
                strokeWidth={1.7}
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-stone-900">
                Your Cart
              </h2>

              <p className="text-xs text-stone-500">
                {cartItems.length === 0
                  ? 'Your cart is empty'
                  : `${cartItems.length} item${
                      cartItems.length > 1 ? 's' : ''
                    }`}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              text-stone-500
              transition
              hover:bg-stone-100
              hover:text-stone-900
            "
          >
            <X
              size={20}
              strokeWidth={1.7}
            />
          </button>

        </div>

        {/* Cart items */}
        <div className="
          flex-1
          overflow-y-auto
          px-5
          py-5
        ">

          {cartItems.length === 0 ? (

            <div className="
              flex
              h-full
              flex-col
              items-center
              justify-center
              text-center
            ">

              <div className="
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                bg-[#e8efdc]
                text-[#173b25]
              ">
                <ShoppingBag
                  size={30}
                  strokeWidth={1.5}
                />
              </div>

              <h3 className="
                mt-5
                text-lg
                font-medium
                text-stone-900
              ">
                Your cart is empty
              </h3>

              <p className="
                mt-2
                max-w-[270px]
                text-sm
                leading-6
                text-stone-500
              ">
                Explore our natural herbs and discover
                something you'll love.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="
                  mt-6
                  rounded-full
                  bg-[#173b25]
                  px-7
                  py-3
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-[#245534]
                "
              >
                Continue Shopping
              </button>

            </div>

          ) : (

            <div className="space-y-4">

              {cartItems.map((item) => (

                <div
                  key={item.id}
                  className="
                    rounded-2xl
                    border
                    border-stone-200
                    bg-white
                    p-4
                  "
                >

                  <div className="flex gap-4">

                    {/* Product image */}
                    <div className="
                      relative
                      h-[100px]
                      w-[90px]
                      shrink-0
                      overflow-hidden
                      rounded-xl
                      bg-[#f5f3eb]
                    ">

                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="90px"
                        className="object-contain"
                      />

                    </div>

                    {/* Product information */}
                    <div className="min-w-0 flex-1">

                      <div className="
                        flex
                        items-start
                        justify-between
                        gap-3
                      ">

                        <div className="min-w-0">

                          <p className="
                            text-[10px]
                            font-medium
                            uppercase
                            tracking-[0.18em]
                            text-stone-400
                          ">
                            Earthymic
                          </p>

                          <h3 className="
                            mt-1
                            truncate
                            text-sm
                            font-medium
                            text-stone-900
                          ">
                            {item.name}
                          </h3>

                          <p className="
                            mt-1
                            text-sm
                            font-medium
                            text-[#173b25]
                          ">
                            ₹{item.price}
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item.id)
                          }
                          aria-label={`Remove ${item.name}`}
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            text-stone-400
                            transition
                            hover:bg-red-50
                            hover:text-red-500
                          "
                        >
                          <Trash2
                            size={15}
                            strokeWidth={1.6}
                          />
                        </button>

                      </div>

                      {/* Quantity */}
                      <div className="
                        mt-4
                        flex
                        items-center
                        justify-between
                      ">

                        <div className="
                          flex
                          items-center
                          rounded-full
                          border
                          border-stone-200
                          bg-stone-50
                        ">

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              text-stone-600
                              hover:bg-stone-200
                            "
                          >
                            <Minus size={13} />
                          </button>

                          <span className="
                            w-8
                            text-center
                            text-sm
                            font-medium
                            text-stone-800
                          ">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              text-stone-600
                              hover:bg-stone-200
                            "
                          >
                            <Plus size={13} />
                          </button>

                        </div>

                        <span className="
                          text-sm
                          font-medium
                          text-stone-900
                        ">
                          ₹{item.price * item.quantity}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* Bottom summary */}
        {cartItems.length > 0 && (

          <div className="
            shrink-0
            border-t
            border-stone-200
            bg-white
            px-6
            py-5
          ">

            <div className="space-y-3">

              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">
                  Subtotal
                </span>
                <span className="text-sm font-medium text-stone-900">
                  ₹{cartTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
            type="button"
            onClick={() => {
              onClose()
              router.push('/checkout')
            }}
            className="
              mt-4
              w-full
              rounded-full
              bg-[#173b25]
              py-3.5
              text-sm
              font-medium
              text-white
              transition
              hover:bg-[#245534]
            "
          >
            Proceed to Checkout
          </button>

            <button
              type="button"
              onClick={onClose}
              className="
                mt-3
                w-full
                rounded-full
                border
                border-stone-300
                bg-white
                py-3
                text-sm
                font-medium
                text-stone-700
                transition
                hover:bg-stone-50
              "
            >
              Continue Shopping
            </button>

            <button
              type="button"
              onClick={clearCart}
              className="
                mt-4
                w-full
                text-xs
                text-stone-400
                transition
                hover:text-red-500
              "
            >
              Clear Cart
            </button>

          </div>

        )}

      </aside>

    </div>,
    document.body
  )
}