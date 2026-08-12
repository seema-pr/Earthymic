'use client'

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f0] px-5 py-16">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#173b25] text-2xl text-white">
          ✓
        </div>

        <h1 className="mt-6 text-3xl font-semibold text-[#173b25]">
          Order Placed Successfully!
        </h1>

        <p className="mt-3 text-stone-600">
          Thank you for shopping with Earthymic.
          Your order has been received successfully.
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = '/'
          }}
          className="mt-8 rounded-full bg-[#173b25] px-8 py-3.5 text-sm font-medium text-white transition hover:bg-[#245534]"
        >
          Continue Shopping
        </button>

      </div>
    </main>
  )
}