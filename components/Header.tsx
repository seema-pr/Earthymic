'use client'

import { Search, ShoppingBag, Menu, X, User } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { useAuth } from '@/components/AuthProvider'

const navigation = [
  { label: 'Shop', href: '/#shop' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
]

type HeaderProps = {
  onCartOpen: () => void
}

export default function Header({ onCartOpen }: HeaderProps) {
  const { cartCount } = useCart()
  const { isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#f8f6f0]/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <a
          href="#home"
          className="flex items-center"
          aria-label="Earthymic home"
        >
          <img
            src="/assets/earthymic-logo.png"
            alt="Earthymic"
            className="h-24 w-[100px] object-contain"
          />
        </a>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-10 md:flex">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium tracking-[0.08em] text-stone-700 transition-colors hover:text-stone-950"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            type="button"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-950"
          >
            <Search size={20} strokeWidth={1.7} />
          </button>

          {/* Shopping cart */}
          <button
            type="button"
            aria-label="Shopping cart"
            onClick={onCartOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-950"
          >
            <ShoppingBag size={20} strokeWidth={1.7} />

            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-900 px-1 text-[9px] font-medium text-white">
              {cartCount}
            </span>
          </button>
          {/* Account */}
          <Link
            href={isAuthenticated ? '/account' : '/login'}
            aria-label={isAuthenticated ? 'My account' : 'Log in'}
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-950"
          >
            <User size={20} strokeWidth={1.7} />
          </Link>

          {/* Mobile menu */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-stone-700 md:hidden"
          >
            {menuOpen ? (
              <X size={21} strokeWidth={1.7} />
            ) : (
              <Menu size={21} strokeWidth={1.7} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <nav className="border-t border-stone-200/70 bg-[#f8f6f0] px-5 py-5 md:hidden">
          <div className="flex flex-col gap-5">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium uppercase tracking-[0.12em] text-stone-700"
              >
                {item.label}
              </a>
            ))}
            <Link
              href={isAuthenticated ? '/account' : '/login'}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium uppercase tracking-[0.12em] text-stone-700"
            >
              {isAuthenticated ? 'My Account' : 'Login'}
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
