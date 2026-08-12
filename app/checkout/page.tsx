'use client'

import { useCart } from '@/components/CartProvider'

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart()

  const gst = cartTotal * 0.18
  const shipping = cartTotal >= 999 ? 0 : 50
  const grandTotal = cartTotal + gst + shipping

  return (
    <main className="min-h-screen bg-[#f8f6f0] px-5 py-10">
      <div className="mx-auto max-w-5xl">

        <h1 className="text-3xl font-semibold text-[#173b25]">
          Checkout
        </h1>

        <div className="mt-8 grid gap-8 md:grid-cols-2">

          {/* Customer Details */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-900">
              Delivery Details
            </h2>

            <div className="mt-6 space-y-4">

              <input
                type="text"
                placeholder="Full Name"
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
              />

              <input
                type="tel"
                placeholder="Mobile Number"
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
              />

              <input
                type="email"
                placeholder="Email Address"
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
              />

              <textarea
                placeholder="Complete Address"
                rows={4}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                />

                <input
                  type="text"
                  placeholder="State"
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                />
              </div>

              <input
                type="text"
                placeholder="PIN Code"
                maxLength={6}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
              />

            </div>
          </section>

          {/* Order Summary */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold text-stone-900">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4">

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-stone-900">
                      {item.name}
                    </p>

                    <p className="text-sm text-stone-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <span className="font-medium text-stone-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="border-t border-stone-200 pt-4 space-y-3">

                <div className="flex justify-between">
                  <span className="text-sm text-stone-500">
                    Subtotal
                  </span>
                  <span>
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-stone-500">
                    GST (18%)
                  </span>
                  <span>
                    ₹{gst.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-stone-500">
                    Shipping
                  </span>
                  <span>
                    {shipping === 0
                      ? 'FREE'
                      : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-stone-200 pt-4 flex justify-between">
                  <span className="font-semibold text-stone-900">
                    Grand Total
                  </span>

                  <span className="text-xl font-semibold text-[#173b25]">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>

              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-full bg-[#173b25] py-3.5 text-sm font-medium text-white transition hover:bg-[#245534]"
              >
                Place Order
              </button>

            </div>
          </section>

        </div>
      </div>
    </main>
  )
}