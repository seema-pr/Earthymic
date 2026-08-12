'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const result = await login(email, password)

    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Unable to log in.')
      return
    }

    router.push('/account')
  }

  return (
    <main className="min-h-screen bg-[#f8f6f0] px-5 py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold text-[#173b25]">
          Log In
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Welcome back to Earthymic.
        </p>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {submitting ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-[#173b25] hover:underline">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
