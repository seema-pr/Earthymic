'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    const result = await register(name, email, password)

    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Unable to create your account.')
      return
    }

    router.push('/account')
  }

  return (
    <main className="min-h-screen bg-[#f8f6f0] px-5 py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold text-[#173b25]">
          Create Account
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Join Earthymic for a faster checkout and order history.
        </p>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
            />

            {/* Email */}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
            />

            {/* Confirm Password */}
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[#173b25] py-3.5 text-sm font-medium text-white transition hover:bg-[#245534] disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {submitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[#173b25] hover:underline">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
