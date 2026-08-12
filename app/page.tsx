'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ProductGrid from '@/components/ProductGrid'
import About from '@/components/About'
import Contact from '@/components/Contact'
import CartDrawer from '@/components/CartDrawer'

type HeaderProps = {
  onCartOpen: () => void
}
export default function Home() {
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <Header onCartOpen={() => setCartOpen(true)} />
      <main>
        <Hero />
        <ProductGrid />
        <About />
        <Contact />
      </main>
      <CartDrawer
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      />
    </>
  )
}
