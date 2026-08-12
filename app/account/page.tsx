'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

type AccountUser = {
  id: string
  name: string
  email: string
}

export default function AccountPage() {
  const router = useRouter()
  const { user, loading, logout, updateProfile } = useAuth()

  /*
   * Route guard — redirect to /login if there's no session.
   * (Waits for `loading` so we don't redirect before the
   * localStorage session has a chance to restore.)
   */
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-[#f8f6f0] px-5 py-16">
        <div className="mx-auto max-w-md text-center text-sm text-stone-500">
          Loading your account...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f6f0] px-5 py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold text-[#173b25]">
          My Account
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Manage your profile details.
        </p>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          {/* Keyed by user.id so field state initializes fresh per session */}
          <ProfileForm key={user.id} user={user} updateProfile={updateProfile} />

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-full border border-[#173b25] py-3.5 text-sm font-medium text-[#173b25] transition hover:bg-[#173b25] hover:text-white"
          >
            LOG OUT
          </button>
        </section>
      </div>
    </main>
  )
}

function ProfileForm({
  user,
  updateProfile,
}: {
  user: AccountUser
  updateProfile: (updates: { name?: string; email?: string }) => Promise<{ success: boolean; error?: string }>
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    const result = await updateProfile({ name, email })

    setSaving(false)

    if (!result.success) {
      setError(result.error || 'Unable to save changes.')
      return
    }

    setMessage('Profile updated successfully.')
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-stone-400">
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
        />
      </div>

      {/* Email */}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-stone-400">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-[#173b25] py-3.5 text-sm font-medium text-white transition hover:bg-[#245534] disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {saving ? 'SAVING...' : 'SAVE CHANGES'}
      </button>
    </form>
  )
}
