'use client'

import { useState } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  /*
   * UI-only mock submit — no backend wired up yet.
   * TODO: replace with a real API call (e.g. POST /api/contact)
   * once a backend/email service is in place.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    setSubmitting(false)
    setSubmitted(true)
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <section id="contact" className="bg-[#f8f6f0] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Get In Touch
          </p>

          <h2 className="text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
            Contact Us
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-stone-900">
              Reach Out
            </h3>

            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8efdc] text-[#173b25]">
                  <Mail size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-sm font-medium text-stone-900">Email</p>
                  <p className="text-sm text-stone-500">hello@earthymic.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8efdc] text-[#173b25]">
                  <Phone size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-sm font-medium text-stone-900">Phone</p>
                  <p className="text-sm text-stone-500">+91 00000 00000</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8efdc] text-[#173b25]">
                  <MapPin size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-sm font-medium text-stone-900">Address</p>
                  <p className="text-sm text-stone-500">India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-stone-900">
              Send a Message
            </h3>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
              />

              <textarea
                placeholder="Your Message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#173b25]"
              />

              {submitted && (
                <p className="text-sm text-green-700">
                  Thanks for reaching out — we&apos;ll get back to you soon.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-[#173b25] py-3.5 text-sm font-medium text-white transition hover:bg-[#245534] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {submitting ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
