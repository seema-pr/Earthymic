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

  const { cartItems, cartTotal } = useCart()

  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<StateItem[]>([])

  const [country, setCountry] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pinCode, setPinCode] = useState('')

  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const [addressVerified, setAddressVerified] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

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
    if (!country) {
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
              iso2: country,
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
  }, [country])

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
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number'
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
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

    if (!/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = 'Enter a valid 6-digit PIN code'
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

    const trimmedAddress = address.trim()
    const trimmedCity = city.trim()
    const trimmedState = state.trim()
    const trimmedPin = pinCode.trim()

    if (!country) {
      setVerificationMessage('Please select your country.')
      return
    }

    if (!trimmedState) {
      setVerificationMessage('Please select your state.')
      return
    }

    if (!trimmedCity) {
      setVerificationMessage('Please enter your city.')
      return
    }

    // if (!trimmedAddress) {
    //   setVerificationMessage('Please enter your complete address.')
    //   return
    // }

    if (!/^\d{6}$/.test(trimmedPin)) {
      setVerificationMessage('Please enter a valid 6-digit PIN code.')
      return
    }

    /*
     * Currently our PIN verification is for India.
     */
    if (country !== 'IN') {
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

      /*
       * State validation
       *
       * We intentionally do NOT compare city against District.
       *
       * Example:
       * Bhubaneswar + 751019
       * API may return District = Khorda.
       *
       * That does not mean Bhubaneswar is invalid.
       */
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

  const handlePlaceOrder = () => {
    const isValid = validateForm()

    if (!isValid) {
      return
    }

    console.log('Checkout form is valid', formData)
  }
  /*
   * Start Razorpay payment
   */
  const handlePayment = async () => {
    if (!addressVerified) {
      setVerificationMessage(
        'Please verify your address before placing the order.',
      )

      return
    }

    if (!cartItems.length) {
      alert('Your cart is empty.')
      return
    }

    if (!window.Razorpay) {
      alert('Payment system is still loading. Please try again in a moment.')

      return
    }

    setPaymentLoading(true)

    try {
      /*
       * Create Razorpay order on our server
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

      /*
       * Razorpay Checkout configuration
       */
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
           * We will add server-side payment verification
           * before production.
           */
          window.location.href = '/order-success'
        },

        prefill: {
          name: '',
          email: '',
          contact: '',
        },

        notes: {
          address,
          city,
          state,
          country,
          pinCode,
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

      /*
       * Open Razorpay
       */
      const razorpay = new window.Razorpay(options)

      /*
       * Payment failure
       */
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
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                />

                {/* Mobile */}
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Mobile Number"
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                />

                {/* Email */}
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                />

                {/* Address */}
                <textarea
                  name="address"
                  placeholder="Complete Address"
                  rows={4}
                  value={formData.address}
                  onChange={(e) => {
                    handleChange(e)
                    setAddressVerified(false)
                    setVerificationMessage('')
                  }}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
                />

                {/* Country */}
                <select
                  value={country}
                  onChange={(e) => {
                    const selectedCountry = e.target.value
                    setCountry(selectedCountry)
                    setFormData((prev) => ({
                      ...prev,
                      country: selectedCountry,
                      state: '',
                      city: '',
                      pinCode: '',
                    }))
                    setState('')
                    setCity('')
                    setPinCode('')
                    setAddressVerified(false)
                    setVerificationMessage('')
                  }}
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

                {/* State */}
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value)
                    setCity('')
                    setPinCode('')
                    setAddressVerified(false)
                    setVerificationMessage('')
                  }}
                  disabled={!country || loadingStates}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-[#173b25] disabled:bg-stone-100"
                >
                  <option value="">
                    {!country
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

                {/* City */}
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={city}
                  onChange={(e) => {
                    const selectedCity = e.target.value

                    setCity(selectedCity)

                    setFormData((prev) => ({
                      ...prev,
                      city: selectedCity,
                    }))

                    setAddressVerified(false)
                    setVerificationMessage('')
                  }}
                  disabled={!state}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25] disabled:bg-stone-100"
                />

                {/* PIN */}
                <input
                  type="text"
                  name="pinCode"
                  placeholder="PIN Code"
                  maxLength={6}
                  inputMode="numeric"
                  value={pinCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')

                    setPinCode(value)

                    setFormData((prev) => ({
                      ...prev,
                      pinCode: value,
                    }))

                    setAddressVerified(false)
                    setVerificationMessage('')
                  }}
                  disabled={!city}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25] disabled:bg-stone-100"
                />

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
                  disabled={!addressVerified || paymentLoading}
                  onClick={handlePlaceOrder}
                  className="mt-4 w-full rounded-full bg-[#173b25] py-3.5 text-sm font-medium text-white transition hover:bg-[#245534] disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {paymentLoading
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
