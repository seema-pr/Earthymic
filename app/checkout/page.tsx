'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/CartProvider'

type Country = {
  name: string
  code: string
}

type StateItem = {
  name: string
  state_code?: string
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart()

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pinCode: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<StateItem[]>([])

  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [addressVerified, setAddressVerified] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

  /*
   * These values are currently used only for displaying
   * the estimated checkout summary.
   *
   * The final amount sent to Razorpay must later be
   * independently calculated on the server.
   */
  const gst = cartTotal * 0.18
  const shipping = cartTotal >= 999 ? 0 : 50
  const grandTotal = cartTotal + gst + shipping

  /*
   * Load countries
   */
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true)

      try {
        const response = await fetch(
          'https://countriesnow.space/api/v0.1/countries',
        )

        if (!response.ok) {
          throw new Error('Failed to load countries')
        }

        const data = await response.json()

        if (data?.data) {
          const countryList: Country[] = data.data.map(
            (item: { country: string; iso2: string }) => ({
              name: item.country,
              code: item.iso2,
            }),
          )

          setCountries(countryList)
        }
      } catch (error) {
        console.error('Failed to load countries:', error)

        setVerificationMessage(
          'Unable to load countries. Please refresh the page.',
        )
      } finally {
        setLoadingCountries(false)
      }
    }

    loadCountries()
  }, [])

  /*
   * Load states whenever country changes
   */
  useEffect(() => {
    if (!formData.country) {
      setStates([])
      return
    }

    const loadStates = async () => {
      setLoadingStates(true)
      setStates([])

      try {
        const response = await fetch(
          'https://countriesnow.space/api/v0.1/countries/states',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              iso2: formData.country,
            }),
          },
        )

        if (!response.ok) {
          throw new Error('Failed to load states')
        }

        const data = await response.json()

        if (!data?.error && data?.data?.states) {
          setStates(data.data.states)
        } else {
          setStates([])
        }
      } catch (error) {
        console.error('Failed to load states:', error)
        setStates([])
      } finally {
        setLoadingStates(false)
      }
    }

    loadStates()
  }, [formData.country])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))

    // Any checkout data change requires validation again
    setAddressVerified(false)
    setVerificationMessage('')
  }

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = e.target.value

    setFormData((prev) => ({
      ...prev,
      country: selectedCountry,
      state: '',
      city: '',
      pinCode: '',
    }))

    setErrors((prev) => ({
      ...prev,
      country: '',
      state: '',
      city: '',
      pinCode: '',
    }))

    setAddressVerified(false)
    setVerificationMessage('')
  }

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value

    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      city: '',
      pinCode: '',
    }))

    setErrors((prev) => ({
      ...prev,
      state: '',
      city: '',
      pinCode: '',
    }))

    setAddressVerified(false)
    setVerificationMessage('')
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedCity = e.target.value

    setFormData((prev) => ({
      ...prev,
      city: selectedCity,
    }))

    setErrors((prev) => ({
      ...prev,
      city: '',
    }))

    setAddressVerified(false)
    setVerificationMessage('')
  }

  const handlePinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')

    setFormData((prev) => ({
      ...prev,
      pinCode: value,
    }))

    setErrors((prev) => ({
      ...prev,
      pinCode: '',
    }))

    setAddressVerified(false)
    setVerificationMessage('')
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!/^[6-9]\d{9}$/.test(formData.mobile.trim())) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number'
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Complete address is required'
    }

    if (!formData.country) {
      newErrors.country = 'Please select a country'
    }

    if (!formData.state) {
      newErrors.state = 'Please select a state'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!/^\d{6}$/.test(formData.pinCode.trim())) {
      newErrors.pinCode = 'Enter a valid 6-digit PIN code'
    }

    if (!cartItems.length) {
      newErrors.cart = 'Your cart is empty'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  /*
   * Verify address
   */
  const verifyAddress = async () => {
    setVerificationMessage('')
    setAddressVerified(false)

    const newErrors: Record<string, string> = {}

    const trimmedFullName = formData.fullName.trim()
    const trimmedMobile = formData.mobile.trim()
    const trimmedEmail = formData.email.trim()
    const trimmedAddress = formData.address.trim()
    const trimmedCity = formData.city.trim()
    const trimmedState = formData.state.trim()
    const trimmedPin = formData.pinCode.trim()

    // Customer validation
    if (!trimmedFullName) {
      newErrors.fullName = 'Full name is required'
    }

    if (!/^[6-9]\d{9}$/.test(trimmedMobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number'
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      newErrors.email = 'Enter a valid email address'
    }

    // Address validation
    if (!trimmedAddress) {
      newErrors.address = 'Complete address is required'
    }

    if (!formData.country) {
      newErrors.country = 'Please select a country'
    }

    if (!trimmedState) {
      newErrors.state = 'Please select a state'
    }

    if (!trimmedCity) {
      newErrors.city = 'City is required'
    }

    if (!/^\d{6}$/.test(trimmedPin)) {
      newErrors.pinCode = 'Enter a valid 6-digit PIN code'
    }

    setErrors(newErrors)

    // Stop here if any validation fails
    if (Object.keys(newErrors).length > 0) {
      return
    }

    // Non-India addresses: currently no PIN API verification
    if (formData.country !== 'IN') {
      setAddressVerified(true)
      setVerificationMessage(
        'Address details saved. PIN verification is currently available for India.',
      )
      return
    }

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${trimmedPin}`,
      )

      if (!response.ok) {
        throw new Error('PIN verification failed')
      }

      const data = await response.json()

      if (
        !data?.[0] ||
        data[0].Status !== 'Success' ||
        !data[0].PostOffice?.length
      ) {
        setVerificationMessage('Invalid PIN code. Please check your address.')
        return
      }

      const postOffice = data[0].PostOffice[0]

      const pinState = postOffice.State?.toLowerCase().trim() || ''
      const enteredState = trimmedState.toLowerCase()

      if (
        !pinState.includes(enteredState) &&
        !enteredState.includes(pinState)
      ) {
        setVerificationMessage(
          `PIN ${trimmedPin} belongs to ${postOffice.State}, not ${trimmedState}.`,
        )
        return
      }

      setAddressVerified(true)

      setVerificationMessage(
        `Address verified ✓ ${postOffice.District}, ${postOffice.State}`,
      )
    } catch (error) {
      console.error('Address verification failed:', error)

      setVerificationMessage(
        'Unable to verify the address right now. Please try again.',
      )
    }
  }

  /*
   * Start Razorpay payment
   */
  const handlePayment = async () => {
    if (!cartItems.length) {
      setErrors((prev) => ({
        ...prev,
        cart: 'Your cart is empty',
      }))
      return
    }

    if (!addressVerified) {
      setVerificationMessage(
        'Please verify your address before placing the order.',
      )
      return
    }

    if (!window.Razorpay) {
      alert('Payment system is still loading. Please try again in a moment.')
      return
    }

    setPaymentLoading(true)

    try {
      /*
       * TEMPORARY:
       * The server route will be corrected next so that
       * it calculates the trusted amount from cart product data.
       */
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: grandTotal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to create payment order.')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount: data.amount,

        currency: data.currency,

        name: 'Earthymic',

        description: 'Earthymic Order',

        order_id: data.id,

        handler: function (response: any) {
          console.log('Razorpay payment response:', response)

          /*
           * TEMPORARY:
           * Do NOT consider this production-ready.
           *
           * Next priority step:
           * Send razorpay_payment_id,
           * razorpay_order_id and razorpay_signature
           * to our server for verification.
           */
          window.location.href = '/order-success'
        },

        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.mobile,
        },

        notes: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pinCode: formData.pinCode,
        },

        theme: {
          color: '#173b25',
        },

        modal: {
          ondismiss: function () {
            setPaymentLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response?.error)

        setPaymentLoading(false)

        alert(
          response?.error?.description || 'Payment failed. Please try again.',
        )
      })

      razorpay.open()
    } catch (error) {
      console.error('Payment initialization failed:', error)

      setPaymentLoading(false)

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to start payment. Please try again.',
      )
    }
  }

  /*
   * Validate the complete checkout form and then
   * continue into the existing payment flow.
   */
  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      setErrors((prev) => ({
        ...prev,
        cart: 'Your cart is empty',
      }))
      return
    }

    if (!addressVerified) {
      setVerificationMessage('Please verify your address before continuing.')
      return
    }

    await handlePayment()
  }

  return (
    <>
      {/* Razorpay Checkout */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <main className="min-h-screen bg-[#f8f6f0] px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold text-[#173b25]">Checkout</h1>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {/* Customer Details */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-stone-900">
                Delivery Details
              </h2>

              <div className="mt-6 space-y-4">
                {/* Full Name */}
                <div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                  />

                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Mobile Number"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                  />

                  {errors.mobile && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                  />

                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <textarea
                    name="address"
                    placeholder="Complete Address"
                    rows={4}
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                  />

                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleCountryChange}
                    disabled={loadingCountries}
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-[#173b25] disabled:bg-stone-100"
                  >
                    <option value="">
                      {loadingCountries
                        ? 'Loading countries...'
                        : 'Select Country'}
                    </option>

                    {countries.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.country}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    disabled={!formData.country || loadingStates}
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-[#173b25] disabled:bg-stone-100"
                  >
                    <option value="">
                      {!formData.country
                        ? 'Select country first'
                        : loadingStates
                          ? 'Loading states...'
                          : states.length === 0
                            ? 'No states available'
                            : 'Select State'}
                    </option>

                    {states.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleCityChange}
                    disabled={!formData.state}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25] disabled:bg-stone-100"
                  />

                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                {/* PIN */}
                <div>
                  <input
                    type="text"
                    name="pinCode"
                    placeholder="PIN Code"
                    maxLength={6}
                    inputMode="numeric"
                    value={formData.pinCode}
                    onChange={handlePinCodeChange}
                    disabled={!formData.city}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25] disabled:bg-stone-100"
                  />

                  {errors.pinCode && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.pinCode}
                    </p>
                  )}
                </div>

                {/* Verify Address */}
                <button
                  type="button"
                  onClick={verifyAddress}
                  disabled={addressVerified}
                  className="w-full rounded-full border border-[#173b25] py-3.5 text-sm font-medium text-[#173b25] transition hover:bg-[#173b25] hover:text-white disabled:cursor-not-allowed disabled:border-green-700 disabled:bg-green-50 disabled:text-green-700"
                >
                  {addressVerified ? 'ADDRESS VERIFIED ✓' : 'VERIFY ADDRESS'}
                </button>

                {/* Verification message */}
                {verificationMessage && (
                  <p
                    className={`text-sm ${
                      addressVerified ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {verificationMessage}
                  </p>
                )}
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
                      <p className="font-medium text-stone-900">{item.name}</p>

                      <p className="text-sm text-stone-500">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <span className="font-medium text-stone-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                {errors.cart && (
                  <p className="text-sm text-red-600">{errors.cart}</p>
                )}

                <div className="space-y-3 border-t border-stone-200 pt-4">
                  {/* Subtotal */}
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500">Subtotal</span>

                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>

                  {/* GST */}
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500">GST (18%)</span>

                    <span>₹{gst.toFixed(2)}</span>
                  </div>

                  {/* Shipping */}
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500">Shipping</span>

                    <span>
                      {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between border-t border-stone-200 pt-4">
                    <span className="font-semibold text-stone-900">
                      Grand Total
                    </span>

                    <span className="text-xl font-semibold text-[#173b25]">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Pay Now */}
                <button
                  type="button"
                  disabled={
                    !addressVerified ||
                    paymentLoading ||
                    isSubmitting ||
                    cartItems.length === 0
                  }
                  onClick={handlePlaceOrder}
                  className="mt-4 w-full rounded-full bg-[#173b25] py-3.5 text-sm font-medium text-white transition hover:bg-[#245534] disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {paymentLoading || isSubmitting
                    ? 'OPENING PAYMENT...'
                    : addressVerified
                      ? 'PAY NOW'
                      : 'VERIFY ADDRESS TO CONTINUE'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
